/**
 * 调用模型并解析 Codex 结构的审查结果。
 *
 * 输出契约来自 Codex `review/rubric.md`：
 * `{ findings[], overall_correctness, overall_explanation, overall_confidence_score }`。
 * 解析策略也按 Codex 的容错顺序：整段 JSON → 第一个 `{` 到最后一个 `}` → 原文兜底。
 *
 * @module @uponnoise/dsh-code-review/lib/review
 */
import { CodeReviewError } from './errors.js';

/**
 * 流式跑一次审查。
 *
 * @param {{
 *   llm: {stream: (options: Record<string, unknown>) => AsyncIterable<any>},
 *   selection: {provider: string, model: string, reasoningEffort?: string},
 *   system: string,
 *   user: string,
 *   signal?: AbortSignal,
 *   onDelta?: (text: string) => void | Promise<void>,
 *   onThinking?: (text: string) => void | Promise<void>,
 * }} input
 * @returns {Promise<{text: string, reasoning: string, finish: any}>}
 */
export async function streamReview({ llm, selection, system, user, signal, onDelta, onThinking }) {
  let text = '';
  let reasoning = '';
  let finish = null;
  const options = {
    provider: selection.provider,
    model: selection.model,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: user }] }],
    ...(typeof selection.reasoningEffort === 'string' && selection.reasoningEffort !== ''
      ? { reasoningEffort: selection.reasoningEffort }
      : {}),
    ...(signal === undefined ? {} : { signal }),
  };

  const iterator = llm.stream(options);
  for await (const chunk of iterator) {
    if (chunk?.type === 'text-delta' && typeof chunk.text === 'string') {
      text += chunk.text;
      if (typeof onDelta === 'function') await onDelta(chunk.text);
      continue;
    }
    if (chunk?.type === 'reasoning-delta' && typeof chunk.text === 'string') {
      reasoning += chunk.text;
      if (typeof onThinking === 'function') await onThinking(chunk.text);
      continue;
    }
    if (chunk?.type === 'finish') finish = chunk.reason ?? null;
  }

  if (finish?.kind === 'error') {
    throw new CodeReviewError('llm-error', finish.failure?.message ?? '模型调用失败。', 502);
  }
  if (finish?.kind === 'aborted') {
    throw new CodeReviewError('llm-aborted', '审查已中断。', 499);
  }
  if (text.trim() === '') {
    throw new CodeReviewError('llm-empty', '模型没有返回任何内容。', 502);
  }
  return { text, reasoning, finish };
}

/**
 * 尝试从模型输出里抽出 JSON 对象。
 *
 * @param {string} text
 * @returns {{value: any | null, mode: 'direct'|'fenced'|'braces'|'none'}}
 */
export function extractReviewJson(text) {
  const trimmed = text.replace(/^\uFEFF/u, '').trim();
  if (trimmed === '') return { value: null, mode: 'none' };
  try {
    return { value: JSON.parse(trimmed), mode: 'direct' };
  } catch {
    // 继续尝试容错路径。
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/iu.exec(trimmed);
  if (fenced !== null) {
    try {
      return { value: JSON.parse(fenced[1].trim()), mode: 'fenced' };
    } catch {
      // 继续尝试花括号切片。
    }
  }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try {
      return { value: JSON.parse(trimmed.slice(first, last + 1)), mode: 'braces' };
    } catch {
      // 落到原文兜底。
    }
  }
  return { value: null, mode: 'none' };
}

/**
 * 把任意路径归一成仓库相对路径（正斜杠）。
 *
 * @param {unknown} value
 * @param {string} root
 * @returns {string}
 */
function normalizeRelativePath(value, root) {
  let path = String(value ?? '').trim().replaceAll('\\', '/');
  if (path === '') return '';
  if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) {
    path = path.slice(1, -1);
  }
  const normalizedRoot = String(root ?? '').replaceAll('\\', '/').replace(/\/+$/u, '');
  if (normalizedRoot !== '') {
    const lowerPath = path.toLowerCase();
    const lowerRoot = normalizedRoot.toLowerCase();
    if (lowerPath === lowerRoot) return '';
    if (lowerPath.startsWith(`${lowerRoot}/`)) path = path.slice(normalizedRoot.length + 1);
  }
  path = path.replace(/^\.\//u, '');
  if (/^[ab]\//u.test(path)) path = path.slice(2);
  return path;
}

/**
 * 拼绝对路径（给 `code_location.absolute_file_path` 的展示用）。
 *
 * @param {string} root
 * @param {string} relative
 * @returns {string}
 */
function absoluteDisplayPath(root, relative) {
  const value = String(relative ?? '');
  if (value === '') return '';
  if (/^(?:[A-Za-z]:\/|\/)/u.test(value)) return value;
  const normalizedRoot = String(root ?? '').replaceAll('\\', '/').replace(/\/+$/u, '');
  return normalizedRoot === '' ? value : `${normalizedRoot}/${value}`;
}

/**
 * 把 0–1 的分数夹到合法范围。
 *
 * @param {unknown} value
 * @returns {number | null}
 */
function normalizeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(1, Math.max(0, number));
}

/**
 * 提取优先级：优先数字 `priority`，其次标题里的 `[Px]`。
 *
 * @param {Record<string, any>} finding
 * @returns {number | null}
 */
function normalizePriority(finding) {
  const numeric = Number(finding?.priority);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 3) return numeric;
  const match = /^\s*\[P([0-3])\]/iu.exec(String(finding?.title ?? ''));
  if (match !== null) return Number(match[1]);
  return null;
}

/**
 * 归一化 `overall_correctness`。
 *
 * @param {unknown} value
 * @returns {'patch is correct' | 'patch is incorrect' | null}
 */
function normalizeCorrectness(value) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('incorrect')) return 'patch is incorrect';
  if (text.includes('correct')) return 'patch is correct';
  return null;
}

/**
 * 把模型输出解析成 UI 可直接渲染的结构。
 *
 * @param {string} text 模型最终文本。
 * @param {{root?: string}} [options]
 * @returns {Record<string, any>}
 */
export function parseReviewText(text, options = {}) {
  const root = typeof options.root === 'string' ? options.root : '';
  const extracted = extractReviewJson(text);
  if (extracted.value === null || typeof extracted.value !== 'object' || Array.isArray(extracted.value)) {
    return {
      parsed: false,
      parseMode: extracted.mode,
      findings: [],
      overallExplanation: String(text ?? '').trim(),
      overallCorrectness: null,
      overallConfidenceScore: null,
      rawText: String(text ?? ''),
    };
  }

  const raw = extracted.value;
  const rawFindings = Array.isArray(raw.findings) ? raw.findings : [];
  const findings = rawFindings
    .filter(finding => finding !== null && typeof finding === 'object')
    .map((finding) => {
      const location = finding.code_location ?? finding.codeLocation ?? {};
      const lineRange = location.line_range ?? location.lineRange ?? {};
      const relativePath = normalizeRelativePath(
        location.absolute_file_path ?? location.file_path ?? location.path ?? finding.file,
        root,
      );
      const priority = normalizePriority(finding);
      const rawTitle = String(finding.title ?? '').trim();
      const title = rawTitle.replace(/^\s*\[P[0-3]\]\s*/iu, '').trim() || 'Untitled finding';
      const start = Number.parseInt(lineRange.start ?? finding.line, 10);
      const end = Number.parseInt(lineRange.end ?? lineRange.start ?? finding.line, 10);
      return {
        title,
        rawTitle: rawTitle !== '' ? rawTitle : priority === null ? title : `[P${priority}] ${title}`,
        priority,
        body: String(finding.body ?? '').trim(),
        confidenceScore: normalizeConfidence(finding.confidence_score ?? finding.confidenceScore),
        file: relativePath,
        absolutePath: absoluteDisplayPath(root, relativePath),
        lineStart: Number.isFinite(start) ? Math.max(0, start) : null,
        lineEnd: Number.isFinite(end) ? Math.max(0, end) : null,
      };
    })
    .sort((left, right) => {
      const leftPriority = left.priority === null ? Number.POSITIVE_INFINITY : left.priority;
      const rightPriority = right.priority === null ? Number.POSITIVE_INFINITY : right.priority;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return (right.confidenceScore ?? 0) - (left.confidenceScore ?? 0);
    });

  return {
    parsed: true,
    parseMode: extracted.mode,
    findings,
    overallExplanation: String(raw.overall_explanation ?? '').trim(),
    overallCorrectness: normalizeCorrectness(raw.overall_correctness),
    overallConfidenceScore: normalizeConfidence(raw.overall_confidence_score),
    rawText: String(text ?? ''),
  };
}

/**
 * 统计各优先级数量。
 *
 * @param {Array<{priority: number | null}>} findings
 * @returns {Record<string, number>}
 */
export function countPriorities(findings) {
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0, unknown: 0 };
  for (const finding of findings) {
    if (finding.priority === null) counts.unknown += 1;
    else counts[`P${finding.priority}`] += 1;
  }
  return counts;
}
