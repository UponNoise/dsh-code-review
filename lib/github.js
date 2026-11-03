/**
 * GitHub 侧能力：探测本机 `gh` CLI、读取账号、列出开放 PR、拉取 PR diff。
 *
 * 刻意不把 token 读进 JS 内存：全部交给 gh 自己管理（系统 keyring / hosts.yml），
 * 插件只调用已登录的 CLI。gh 不存在时优雅降级为「只显示 GitHub 链接」。
 *
 * @module @uponnoise/dsh-code-review/lib/github
 */
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { oneLine, probeExecutable, run } from './exec.js';
import { CodeReviewError } from './errors.js';

/** 探测结果缓存（避免每次 health 都起进程）。 */
let ghCache = null;

/** GitHub 数据缓存：key → {at, value}。 */
const overviewCache = new Map();
const OVERVIEW_TTL_MS = 60_000;
const OVERVIEW_FAILURE_TTL_MS = 15_000;

/**
 * 列出候选 gh 位置，按优先级去重。
 *
 * @param {string} [explicit]
 * @returns {string[]}
 */
function ghCandidates(explicit) {
  const list = [
    explicit,
    process.env.DSH_CODE_REVIEW_GH,
    process.env.GH_PATH,
    'gh',
    'C:\\Program Files\\GitHub CLI\\gh.exe',
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'GitHubCLI', 'gh.exe') : null,
    process.env.ProgramW6432 ? join(process.env.ProgramW6432, 'GitHub CLI', 'gh.exe') : null,
    '/opt/homebrew/bin/gh',
    '/usr/local/bin/gh',
    '/usr/bin/gh',
  ];
  const seen = new Set();
  const result = [];
  for (const candidate of list) {
    if (typeof candidate !== 'string' || candidate.trim() === '') continue;
    const value = candidate.trim();
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

/**
 * 探测本机 gh CLI。
 *
 * @param {string} [explicit] 配置里的 ghPath。
 * @returns {Promise<{path: string, version: string} | null>}
 */
export async function detectGh(explicit) {
  const now = Date.now();
  if (ghCache !== null && now - ghCache.at < 60_000 && explicit === undefined) {
    return ghCache.value;
  }
  let found = null;
  for (const candidate of ghCandidates(explicit)) {
    if (candidate.includes('\\') || candidate.includes('/')) {
      try {
        await access(candidate);
      } catch {
        continue;
      }
    }
    const version = await probeExecutable(candidate);
    if (version !== null) {
      found = { path: candidate, version };
      break;
    }
  }
  if (explicit === undefined) ghCache = { at: now, value: found };
  return found;
}

/**
 * 调一次 GitHub REST API，返回解析后的 JSON。
 *
 * @param {{path: string}} gh
 * @param {string} apiPath 例如 `user` 或 `repos/o/r/pulls?state=open`。
 * @param {{timeout?: number}} [options]
 * @returns {Promise<any>}
 */
async function ghApi(gh, apiPath, options = {}) {
  const result = await run(gh.path, [
    'api',
    '-H', 'Accept: application/vnd.github+json',
    '-H', 'X-GitHub-Api-Version: 2022-11-28',
    '--method', 'GET',
    apiPath,
  ], { timeout: options.timeout ?? 25_000 });
  if (!result.ok) {
    const detail = oneLine(result.stderr || result.message);
    throw new CodeReviewError('github-api-failed', `GitHub API 调用失败：${detail || '未知错误'}`, 502);
  }
  const text = result.stdout.trim();
  if (text === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new CodeReviewError('github-api-invalid', 'GitHub API 返回了无法解析的响应。', 502);
  }
}

/**
 * 从 search/issues 的 `repository_url` 中取 `owner/repo`。
 *
 * @param {any} item
 * @returns {string}
 */
function repoFromSearchItem(item) {
  const url = typeof item?.repository_url === 'string' ? item.repository_url : '';
  const marker = '/repos/';
  const index = url.indexOf(marker);
  return index >= 0 ? url.slice(index + marker.length) : '';
}

/**
 * 把 GitHub issue（PR 的 REST 形态）映射成前端要的形状。
 *
 * @param {any} item
 * @returns {Record<string, any>}
 */
function mapSearchPr(item) {
  return {
    number: Number(item?.number) || 0,
    title: String(item?.title ?? ''),
    url: String(item?.html_url ?? ''),
    repo: repoFromSearchItem(item),
    state: String(item?.state ?? 'open'),
    isDraft: Boolean(item?.draft),
    updatedAt: String(item?.updated_at ?? ''),
    author: String(item?.user?.login ?? ''),
    comments: Number(item?.comments) || 0,
  };
}

/**
 * 把 REST pulls 列表项映射成前端要的形状。
 *
 * @param {any} item
 * @returns {Record<string, any>}
 */
function mapRepoPr(item) {
  return {
    number: Number(item?.number) || 0,
    title: String(item?.title ?? ''),
    url: String(item?.html_url ?? ''),
    repo: String(item?.base?.repo?.full_name ?? ''),
    state: String(item?.state ?? 'open'),
    isDraft: Boolean(item?.draft),
    updatedAt: String(item?.updated_at ?? ''),
    author: String(item?.user?.login ?? ''),
    base: String(item?.base?.ref ?? ''),
    head: String(item?.head?.ref ?? ''),
    additions: Number(item?.additions) || 0,
    deletions: Number(item?.deletions) || 0,
    changedFiles: Number(item?.changed_files) || 0,
  };
}

/**
 * 读取 GitHub 账号 + 我的开放 PR + 指定仓库的开放 PR。
 *
 * @param {{repo?: string, login?: string, refresh?: boolean, ghPath?: string}} input
 * @returns {Promise<Record<string, any>>}
 */
export async function githubOverview({ repo, login, refresh = false, ghPath } = {}) {
  const gh = await detectGh(ghPath);
  const configuredLogin = typeof login === 'string' && login.trim() !== '' ? login.trim() : '';
  if (gh === null) {
    return {
      ok: false,
      code: 'gh-missing',
      error: '未找到 GitHub CLI（gh）。安装并登录后即可浏览 PR；链接仍可用。',
      login: configuredLogin,
      user: null,
      myPrs: [],
      repoPrs: [],
      errors: [],
    };
  }

  const key = `${gh.path}\u0000${repo ?? ''}\u0000${configuredLogin}`;
  const cached = overviewCache.get(key);
  const ttl = cached?.value?.ok === false ? OVERVIEW_FAILURE_TTL_MS : OVERVIEW_TTL_MS;
  if (!refresh && cached !== undefined && Date.now() - cached.at < ttl) return cached.value;

  const errors = [];
  let user = null;
  try {
    const raw = await ghApi(gh, 'user');
    if (raw !== null) {
      user = {
        login: String(raw.login ?? ''),
        name: String(raw.name ?? ''),
        avatarUrl: String(raw.avatar_url ?? ''),
        htmlUrl: String(raw.html_url ?? ''),
      };
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const resolvedLogin = configuredLogin || user?.login || '';
  let myPrs = [];
  if (resolvedLogin !== '') {
    try {
      const query = encodeURIComponent(`author:${resolvedLogin} is:pr is:open`);
      const raw = await ghApi(gh, `search/issues?q=${query}&per_page=20&sort=updated&order=desc`);
      myPrs = Array.isArray(raw?.items) ? raw.items.map(mapSearchPr) : [];
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  let repoPrs = [];
  if (typeof repo === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo)) {
    try {
      const raw = await ghApi(gh, `repos/${repo}/pulls?state=open&per_page=20&sort=updated&direction=desc`);
      repoPrs = Array.isArray(raw) ? raw.map(mapRepoPr) : [];
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const value = {
    ok: true,
    gh: { path: gh.path, version: gh.version },
    login: resolvedLogin,
    user,
    myPrs,
    repoPrs,
    errors,
    fetchedAt: new Date().toISOString(),
  };
  overviewCache.set(key, { at: Date.now(), value });
  return value;
}

/**
 * 校验 `owner/repo`。
 *
 * @param {unknown} repo
 * @returns {string}
 */
export function assertRepo(repo) {
  if (typeof repo !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo)) {
    throw new CodeReviewError('invalid-repo', 'GitHub 仓库名不合法（需要 owner/repo）。');
  }
  return repo;
}

/**
 * 校验 PR 编号。
 *
 * @param {unknown} number
 * @returns {number}
 */
export function assertPrNumber(number) {
  const value = Number(number);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000) {
    throw new CodeReviewError('invalid-pr-number', 'PR 编号不合法。');
  }
  return value;
}

/**
 * 读取一个 PR 的元数据与完整 diff。
 *
 * @param {{repo: string, number: number|string, ghPath?: string}} input
 * @returns {Promise<Record<string, any>>}
 */
export async function pullRequestDetail({ repo, number, ghPath }) {
  const fullName = assertRepo(repo);
  const prNumber = assertPrNumber(number);
  const gh = await detectGh(ghPath);
  if (gh === null) {
    throw new CodeReviewError('gh-missing', '未找到 GitHub CLI（gh），无法读取 PR。');
  }

  const viewResult = await run(gh.path, [
    'pr', 'view', String(prNumber),
    '--repo', fullName,
    '--json', 'number,title,state,isDraft,url,baseRefName,headRefName,author,additions,deletions,changedFiles,body,updatedAt',
  ], { timeout: 30_000 });
  if (!viewResult.ok) {
    throw new CodeReviewError('pr-view-failed', `读取 PR #${prNumber} 失败：${oneLine(viewResult.stderr) || '未知错误'}`, 502);
  }
  let meta;
  try {
    meta = JSON.parse(viewResult.stdout);
  } catch {
    throw new CodeReviewError('pr-view-invalid', 'PR 元数据无法解析。', 502);
  }

  const diffResult = await run(gh.path, [
    'pr', 'diff', String(prNumber),
    '--repo', fullName,
  ], { timeout: 60_000 });
  if (!diffResult.ok) {
    const detail = oneLine(diffResult.stderr);
    const tooLarge = /too large|diff too large|maximum/i.test(detail);
    throw new CodeReviewError(
      tooLarge ? 'pr-diff-too-large' : 'pr-diff-failed',
      tooLarge ? 'PR 的 diff 太大，GitHub 拒绝返回。' : `读取 PR diff 失败：${detail || '未知错误'}`,
      502,
    );
  }

  return {
    ok: true,
    pr: {
      number: Number(meta.number) || prNumber,
      title: String(meta.title ?? ''),
      state: String(meta.state ?? ''),
      isDraft: Boolean(meta.isDraft),
      url: String(meta.url ?? `https://github.com/${fullName}/pull/${prNumber}`),
      repo: fullName,
      base: String(meta.baseRefName ?? ''),
      head: String(meta.headRefName ?? ''),
      author: String(meta.author?.login ?? ''),
      additions: Number(meta.additions) || 0,
      deletions: Number(meta.deletions) || 0,
      changedFiles: Number(meta.changedFiles) || 0,
      body: String(meta.body ?? ''),
      updatedAt: String(meta.updatedAt ?? ''),
    },
    diffText: diffResult.stdout,
  };
}
