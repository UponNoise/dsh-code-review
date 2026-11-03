/**
 * HTTP 路由：客户端半只通过这五条同源接口读写。
 *
 * - `GET  /dsh-code-review/api/health`
 * - `GET  /dsh-code-review/api/context?path=`
 * - `POST /dsh-code-review/api/diff`
 * - `GET  /dsh-code-review/api/github?repo=&refresh=`
 * - `POST /dsh-code-review/api/review`（NDJSON 流）
 *
 * 安全边界：只接受本机/已声明 Host；POST 校验同源；所有命令用 execFile 参数数组。
 *
 * @module @uponnoise/dsh-code-review/lib/routes
 */
import {
  MAX_CLIENT_PATCH_CHARS,
  MAX_DIFF_CHARS,
  MAX_FILES,
  clipDiffForPrompt,
  diffStats,
  parseUnifiedDiff,
} from './diff.js';
import { CodeReviewError } from './errors.js';
import { detectGh, githubOverview, pullRequestDetail } from './github.js';
import { collectLocalDiff, inspectRepo } from './git.js';
import { collectRepositoryGuidance } from './guidance.js';
import {
  REVIEW_SYSTEM_PROMPT,
  buildReviewPrompt,
  formatReviewMarkdown,
} from './prompt.js';
import {
  countPriorities,
  parseReviewText,
  streamReview,
} from './review.js';

/** 路由前缀（webServer 上注册 exact 路径）。 */
export const API_PREFIX = '/dsh-code-review/api';

/** 插件版本，出现在 health 里。 */
export const PLUGIN_VERSION = '0.1.0';

const MAX_BODY_BYTES = 64 * 1024;

/**
 * 安全地取一个可选服务。
 *
 * @param {any} ctx
 * @param {string} name
 * @returns {any}
 */
function tryGet(ctx, name) {
  try {
    return typeof ctx?.get === 'function' ? ctx.get(name) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 写 JSON 响应。
 *
 * @param {import('node:http').ServerResponse} response
 * @param {number} status
 * @param {unknown} payload
 */
function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
  response.end(JSON.stringify(payload));
}

/**
 * 读取 JSON 请求体（限长）。
 *
 * @param {import('node:http').IncomingMessage} request
 * @param {number} [maxBytes]
 * @returns {Promise<Record<string, any>>}
 */
async function readJsonBody(request, maxBytes = MAX_BODY_BYTES) {
  const declared = Number(request.headers['content-length']);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new CodeReviewError('body-too-large', '请求体过大。', 413);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new CodeReviewError('body-too-large', '请求体过大。', 413);
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new CodeReviewError('invalid-json', '请求体不是合法 JSON。');
  }
}

/**
 * Host 头是否指向本机或宿主声明的可信 authority。
 *
 * @param {import('node:http').IncomingMessage} request
 * @param {any} ctx
 * @returns {boolean}
 */
function hostAllowed(request, ctx) {
  const host = request.headers.host;
  if (typeof host !== 'string' || host === '') return true; // Desktop 代理会剥掉 Host。
  const lower = host.toLowerCase();
  const name = lower.startsWith('[') ? lower.slice(0, lower.indexOf(']') + 1) : lower.split(':')[0];
  if (name === '127.0.0.1' || name === 'localhost' || name === '[::1]') return true;
  const connection = tryGet(ctx, 'connection');
  const trusted = Array.isArray(connection?.trustedHosts) ? connection.trustedHosts : [];
  return trusted.some(entry => typeof entry === 'string' && (entry.toLowerCase() === lower || entry.toLowerCase() === name));
}

/**
 * POST 同源校验。
 *
 * @param {import('node:http').IncomingMessage} request
 * @returns {boolean}
 */
function sameOrigin(request) {
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

/**
 * 取默认工作目录。
 *
 * @param {any} ctx
 * @returns {string}
 */
function defaultDirectoryOf(ctx) {
  const service = tryGet(ctx, 'workingDirectory');
  return typeof service?.defaultDirectory === 'string' ? service.defaultDirectory : '';
}

/**
 * 解析审查要用的模型（profile 配置优先，跟随 agent-default-model）。
 *
 * @param {any} ctx
 * @param {Record<string, any>} config
 * @returns {{provider: string, model: string, reasoningEffort?: string}}
 */
function resolveSelection(ctx, config) {
  let current = null;
  try {
    current = tryGet(ctx, 'agentDefaultModel')?.currentSelection?.() ?? null;
  } catch {
    current = null;
  }
  const configuredProvider = typeof config?.provider === 'string' ? config.provider.trim() : '';
  const configuredModel = typeof config?.model === 'string' ? config.model.trim() : '';
  const configuredEffort = typeof config?.reasoningEffort === 'string' ? config.reasoningEffort.trim() : '';
  const currentProvider = typeof current?.provider === 'string' ? current.provider : '';
  const currentModel = typeof current?.model === 'string' ? current.model : '';
  const currentEffort = typeof current?.reasoningEffort === 'string' ? current.reasoningEffort : '';
  const selection = {
    provider: configuredProvider || currentProvider,
    model: configuredModel || currentModel,
    reasoningEffort: configuredEffort || currentEffort || undefined,
  };
  return selection;
}

/**
 * 归一化审查模式。
 *
 * @param {unknown} mode
 * @returns {'uncommitted'|'base'|'commit'|'custom'}
 */
function normalizeMode(mode) {
  return mode === 'base' || mode === 'commit' || mode === 'custom' ? mode : 'uncommitted';
}

/**
 * PR diff → 统一目标结构。
 *
 * @param {Record<string, any>} detail
 * @returns {Record<string, any>}
 */
function targetFromPr(detail) {
  const files = parseUnifiedDiff(detail.diffText);
  const pr = detail.pr;
  return {
    ok: true,
    kind: 'pr',
    mode: 'pr',
    root: '',
    repo: null,
    pr,
    title: `PR #${pr.number}: ${pr.title}`,
    subtitle: `${pr.repo} · ${pr.base} ← ${pr.head} · @${pr.author}`,
    diffText: detail.diffText,
    files,
    untracked: [],
    stats: diffStats(files),
    truncated: detail.diffText.length > MAX_DIFF_CHARS,
  };
}

/**
 * 收集一次审查/预览的目标。
 *
 * @param {any} ctx
 * @param {Record<string, any>} config
 * @param {Record<string, any>} body
 * @returns {Promise<Record<string, any>>}
 */
async function collectTarget(ctx, config, body) {
  const source = body?.source;
  if (source !== null && typeof source === 'object' && source.kind === 'pr') {
    const detail = await pullRequestDetail({
      repo: source.repo,
      number: source.number,
      ghPath: config?.ghPath,
    });
    return targetFromPr(detail);
  }

  const requestedPath = typeof body?.path === 'string' && body.path.trim() !== ''
    ? body.path.trim()
    : defaultDirectoryOf(ctx);
  if (requestedPath === '') {
    throw new CodeReviewError('path-required', '没有选择工作区目录。');
  }
  const mode = normalizeMode(body?.mode);
  const local = await collectLocalDiff({
    path: requestedPath,
    mode,
    base: body?.base,
    commit: body?.commit,
  });
  return {
    ...local,
    kind: 'local',
    root: local.repo.root,
    pr: null,
    truncated: local.diffText.length > MAX_DIFF_CHARS,
  };
}

/**
 * 仓库对象 → 可以安全发给浏览器的子集。
 *
 * @param {Record<string, any>} repo
 * @returns {Record<string, any>}
 */
function publicRepo(repo) {
  return {
    path: repo.path,
    root: repo.root,
    name: repo.name,
    branch: repo.branch,
    detached: repo.detached,
    head: repo.head,
    headShort: repo.headShort,
    upstream: repo.upstream,
    ahead: repo.ahead,
    behind: repo.behind,
    dirty: repo.dirty,
    changedFiles: repo.changedFiles,
    changes: repo.changes,
    branches: repo.branches,
    defaultBase: repo.defaultBase,
    github: repo.github,
    remoteUrl: repo.remoteUrl,
    recentCommits: repo.recentCommits,
  };
}

/**
 * 统一目标 → 客户端 payload（按总额度裁剪 patch）。
 *
 * @param {Record<string, any>} target
 * @returns {Record<string, any>}
 */
function clientPayload(target) {
  const files = target.files.slice(0, MAX_FILES);
  let budget = MAX_CLIENT_PATCH_CHARS;
  const publicFiles = files.map((file) => {
    let patch = String(file.patch ?? '');
    let omitted = file.patchOmitted === true;
    if (patch.length > budget) {
      patch = budget <= 0 ? '' : patch.slice(0, budget);
      omitted = true;
    }
    budget = Math.max(0, budget - patch.length);
    return {
      path: file.path,
      oldPath: file.oldPath,
      status: file.status,
      binary: file.binary,
      additions: file.additions,
      deletions: file.deletions,
      patch,
      patchOmitted: omitted,
    };
  });

  const notes = [];
  if (target.files.length > MAX_FILES) notes.push(`文件过多，只发送了前 ${MAX_FILES} 个。`);
  if (budget <= 0 && target.files.length > 0) notes.push('部分 patch 因体积上限未发送，审查提示词仍使用完整 diff（在 220k 字符内）。');
  if (target.truncated) notes.push('diff 超过 220k 字符，送给模型的版本会被截断。');
  if (Array.isArray(target.untracked) && target.untracked.some(file => file.skipped)) {
    notes.push('部分未跟踪文件因体积/可读性被跳过。');
  }

  return {
    ok: true,
    kind: target.kind,
    title: target.title,
    subtitle: target.subtitle,
    repo: target.repo ? publicRepo(target.repo) : null,
    pr: target.pr,
    stats: target.stats,
    files: publicFiles,
    untracked: target.untracked,
    truncated: target.truncated === true,
    notes,
  };
}

/**
 * 构造全部路由。
 *
 * @param {any} ctx Host 上下文。
 * @param {Record<string, any>} config Loader 行配置。
 * @returns {Array<{method: string, path: string, handler: Function}>}
 */
export function createRoutes(ctx, config = {}) {
  const githubUser = typeof config.githubUser === 'string' && config.githubUser.trim() !== ''
    ? config.githubUser.trim()
    : 'UponNoise';

  /**
   * 健康检查：Client 启动时读账号/模型/gh 状态。
   */
  async function healthHandler(_request, response) {
    const gh = await detectGh(config.ghPath);
    const llm = tryGet(ctx, 'llm');
    const selection = resolveSelection(ctx, config);
    sendJson(response, 200, {
      ok: true,
      version: PLUGIN_VERSION,
      githubUser,
      defaultDirectory: defaultDirectoryOf(ctx) || null,
      gh: gh === null ? { available: false } : { available: true, version: gh.version },
      llm: {
        available: typeof llm?.stream === 'function',
        defaultSelection: selection,
      },
      capabilities: {
        localDiff: true,
        githubPr: gh !== null,
        modelReview: typeof llm?.stream === 'function',
      },
      time: new Date().toISOString(),
    });
  }

  /**
   * 仓库上下文。
   */
  async function contextHandler(request, response) {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const requested = url.searchParams.get('path') ?? '';
    const path = requested.trim() !== '' ? requested.trim() : defaultDirectoryOf(ctx);
    if (path === '') throw new CodeReviewError('path-required', '没有选择工作区目录。');
    const context = await inspectRepo(path);
    sendJson(response, 200, { ok: true, context });
  }

  /**
   * 本地 / PR diff。
   */
  async function diffHandler(request, response) {
    const body = await readJsonBody(request);
    const target = await collectTarget(ctx, config, body);
    sendJson(response, 200, clientPayload(target));
  }

  /**
   * GitHub 账号 + PR 列表。
   */
  async function githubHandler(request, response) {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const repo = url.searchParams.get('repo') ?? '';
    const refresh = url.searchParams.get('refresh') === '1';
    const overview = await githubOverview({
      repo,
      login: githubUser,
      refresh,
      ghPath: config.ghPath,
    });
    sendJson(response, 200, { ...overview, configuredUser: githubUser });
  }

  /**
   * NDJSON 流式审查。
   */
  async function reviewHandler(request, response) {
    const body = await readJsonBody(request);
    const source = body?.source;
    const instructions = typeof body?.instructions === 'string' ? body.instructions.trim() : '';
    const mode = source !== null && typeof source === 'object' && source.kind === 'pr'
      ? 'pr'
      : normalizeMode(body?.mode);
    if (mode === 'custom' && instructions === '') {
      throw new CodeReviewError('empty-instructions', '自定义审查需要填写指令。');
    }

    const selection = resolveSelection(ctx, config);
    if (selection.provider === '' || selection.model === '') {
      throw new CodeReviewError('model-unavailable', '当前 profile 没有配置默认模型。', 503);
    }
    const llm = tryGet(ctx, 'llm');
    if (typeof llm?.stream !== 'function') {
      throw new CodeReviewError('llm-unavailable', '当前 profile 没有可用的 llm 服务。', 503);
    }

    response.statusCode = 200;
    response.setHeader('content-type', 'application/x-ndjson; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('connection', 'keep-alive');
    response.setHeader('x-accel-buffering', 'no');
    response.flushHeaders?.();

    const controller = new AbortController();
    let finished = false;
    const emit = (payload) => {
      if (finished || response.writableEnded || response.destroyed) return;
      try {
        response.write(`${JSON.stringify(payload)}\n`);
      } catch {
        // 客户端已断开；finally 会收尾。
      }
    };
    response.on('close', () => {
      if (!finished) controller.abort();
    });

    const reviewId = `review-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();

    try {
      emit({ type: 'status', stage: 'collect', message: '正在收集变更…' });
      const target = await collectTarget(ctx, config, body);
      emit({
        type: 'meta',
        reviewId,
        kind: target.kind,
        title: target.title,
        subtitle: target.subtitle,
        root: target.root,
        stats: target.stats,
        pr: target.pr,
        model: { provider: selection.provider, model: selection.model },
        startedAt,
      });

      if (target.files.length === 0) {
        emit({ type: 'error', code: 'diff-empty', message: '没有可审查的更改。' });
        return;
      }

      const guidance = target.root === ''
        ? []
        : await collectRepositoryGuidance(target.root, target.files);
      if (guidance.length > 0) {
        emit({ type: 'status', stage: 'guidance', message: `已载入 ${guidance.length} 个项目指导文件` });
      }

      const clipped = clipDiffForPrompt(target.diffText);
      const user = buildReviewPrompt({
        mode: target.mode,
        title: target.title,
        subtitle: target.subtitle,
        root: target.root,
        repo: target.repo,
        base: typeof body?.base === 'string' ? body.base : undefined,
        mergeBase: target.mergeBase,
        commit: typeof body?.commit === 'string' ? body.commit : undefined,
        commitTitle: target.commitTitle,
        pr: target.pr,
        instructions,
        files: target.files,
        diffText: clipped.text,
        truncated: clipped.truncated,
        untracked: target.untracked,
        stats: target.stats,
        guidance,
      });

      emit({ type: 'status', stage: 'model', message: `正在请求模型 ${selection.model}…` });
      const { text, reasoning } = await streamReview({
        llm,
        selection,
        system: REVIEW_SYSTEM_PROMPT,
        user,
        signal: controller.signal,
        onDelta: delta => emit({ type: 'delta', text: delta }),
        onThinking: delta => emit({ type: 'thinking', text: delta }),
      });

      emit({ type: 'status', stage: 'parse', message: '正在整理审查结果…' });
      const parsed = parseReviewText(text, { root: target.root });
      const markdown = formatReviewMarkdown(parsed, { root: target.root });
      emit({
        type: 'result',
        result: {
          ...parsed,
          markdown,
          counts: countPriorities(parsed.findings),
          reasoningLength: reasoning.length,
        },
        elapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        const code = error instanceof CodeReviewError ? error.code : 'review-failed';
        const message = error instanceof Error ? error.message : String(error);
        emit({ type: 'error', code, message });
      }
    } finally {
      finished = true;
      try {
        response.end();
      } catch {
        // 已断开。
      }
    }
  }

  /** 延迟导入，避免 routes 顶部循环依赖观感（其实没有循环，但保持模块边界）。 */
  const handlers = [
    { method: 'GET', path: `${API_PREFIX}/health`, handler: healthHandler },
    { method: 'GET', path: `${API_PREFIX}/context`, handler: contextHandler },
    { method: 'POST', path: `${API_PREFIX}/diff`, handler: diffHandler },
    { method: 'GET', path: `${API_PREFIX}/github`, handler: githubHandler },
    { method: 'POST', path: `${API_PREFIX}/review`, handler: reviewHandler },
  ];

  return handlers.map(({ method, path, handler }) => ({
    method,
    path,
    handler: async (request, response) => {
      try {
        if (request.method !== method) {
          sendJson(response, 405, { ok: false, code: 'method-not-allowed', error: `只接受 ${method}。` });
          return;
        }
        if (!hostAllowed(request, ctx)) {
          sendJson(response, 403, { ok: false, code: 'untrusted-host', error: '拒绝非本机 Host 的请求。' });
          return;
        }
        if (method === 'POST' && !sameOrigin(request)) {
          sendJson(response, 403, { ok: false, code: 'untrusted-origin', error: '拒绝非同源请求。' });
          return;
        }
        await handler(request, response);
      } catch (error) {
        if (response.headersSent) {
          try {
            response.end();
          } catch {
            // 已断开。
          }
          return;
        }
        const status = error instanceof CodeReviewError ? error.status : 500;
        const code = error instanceof CodeReviewError ? error.code : 'internal-error';
        const message = error instanceof Error ? error.message : String(error);
        sendJson(response, status, { ok: false, code, error: message });
      }
    },
  }));
}
