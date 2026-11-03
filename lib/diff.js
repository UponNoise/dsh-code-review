/**
 * unified diff 解析与「未跟踪文件 → 合成 diff」。
 *
 * 输入是 `git diff` / `git show` / `gh pr diff` / 合成补丁拼接后的文本；
 * 输出是按文件切片的纯 JSON，既给 UI 渲染，也给审查提示词使用。
 *
 * 设计约束：
 * - 不依赖任何第三方包，Host 端可直接跑；
 * - 每个文件的 patch 有上限，避免一个巨型 lockfile 把响应撑爆；
 * - 路径解析兼容 git 的 C 风格引号（空格、制表符、中文转义）。
 *
 * @module @uponnoise/dsh-code-review/lib/diff
 */

/** 送给模型的 diff 文本上限（字符）。超出会截断并显式告知模型。 */
export const MAX_DIFF_CHARS = 220_000;

/** 单个文件在 UI / 提示词里的 patch 上限（字符）。 */
export const MAX_FILE_PATCH_CHARS = 80_000;

/** 最多展示多少个文件。 */
export const MAX_FILES = 160;

/** 客户端响应里所有 patch 的总预算（字符）。 */
export const MAX_CLIENT_PATCH_CHARS = 900_000;

/** 未跟踪文件最多收集多少个。 */
export const MAX_UNTRACKED_FILES = 60;

/** 单个未跟踪文件最多读取多少字节。 */
export const MAX_UNTRACKED_BYTES = 512 * 1024;

/**
 * 解码 git 输出里的路径 token：`a/foo bar.txt` 或 `"a/\344\270\255.txt"`。
 *
 * @param {string} token
 * @returns {string}
 */
export function unquoteGitPath(token) {
  if (typeof token !== 'string' || token.length === 0) return '';
  if (!token.startsWith('"')) return token;
  const inner = token.endsWith('"') ? token.slice(1, -1) : token.slice(1);
  let bytes = [];
  let out = '';
  const flushBytes = () => {
    if (bytes.length === 0) return;
    // git 的八进制转义是原始 UTF-8 字节；按出现顺序解码，避免中英文错序。
    try {
      out += new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(bytes));
    } catch {
      out += bytes.map(byte => String.fromCharCode(byte)).join('');
    }
    bytes = [];
  };
  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (char !== '\\') {
      flushBytes();
      out += char;
      continue;
    }
    const next = inner[index + 1];
    if (next === undefined) {
      flushBytes();
      out += '\\';
      break;
    }
    if (next >= '0' && next <= '7') {
      let octal = next;
      while (octal.length < 3) {
        const following = inner[index + 1 + octal.length];
        if (following === undefined || following < '0' || following > '7') break;
        octal += following;
      }
      index += octal.length;
      bytes.push(parseInt(octal, 8));
      continue;
    }
    flushBytes();
    if (next === 'n') out += '\n';
    else if (next === 't') out += '\t';
    else if (next === 'r') out += '\r';
    else if (next === '"') out += '"';
    else if (next === '\\') out += '\\';
    else out += next;
    index += 1;
  }
  flushBytes();
  return out;
}

/**
 * 去掉 git 的 `a/` / `b/` 前缀。
 *
 * @param {string} value
 * @returns {string}
 */
function stripGitPrefix(value) {
  return value.startsWith('a/') || value.startsWith('b/') ? value.slice(2) : value;
}

/**
 * 从 `diff --git a/x b/y` 里取出两侧路径。
 *
 * @param {string} line
 * @returns {{oldPath: string, path: string}}
 */
function parseGitHeader(line) {
  const rest = line.slice('diff --git '.length);
  if (rest.startsWith('"')) {
    // 两侧都带引号：`"a/..." "b/..."`
    const close = findClosingQuote(rest, 0);
    if (close > 0) {
      const left = rest.slice(0, close + 1);
      const right = rest.slice(close + 1).trimStart();
      const rightClose = findClosingQuote(right, 0);
      if (rightClose > 0) {
        return {
          oldPath: stripGitPrefix(unquoteGitPath(left)),
          path: stripGitPrefix(unquoteGitPath(right.slice(0, rightClose + 1))),
        };
      }
    }
  }
  const match = /^a\/(.+?) b\/(.+)$/u.exec(rest);
  if (match !== null) return { oldPath: match[1], path: match[2] };
  return { oldPath: rest, path: rest };
}

/**
 * 找引号字符串的闭合位置，跳过 `\"`。
 *
 * @param {string} text
 * @param {number} start
 * @returns {number} 闭合引号下标，找不到为 -1。
 */
function findClosingQuote(text, start) {
  let index = start + 1;
  while (index < text.length) {
    if (text[index] === '\\') {
      index += 2;
      continue;
    }
    if (text[index] === '"') return index;
    index += 1;
  }
  return -1;
}

/**
 * 解析一段 unified diff 文本。
 *
 * @param {string} text
 * @returns {Array<{path: string, oldPath: string, status: 'added'|'deleted'|'renamed'|'modified', binary: boolean, additions: number, deletions: number, patch: string, patchOmitted?: boolean}>}
 */
export function parseUnifiedDiff(text) {
  const source = String(text ?? '');
  const lines = source.split(/\r?\n/u);
  /** @type {Array<Record<string, any>>} */
  const files = [];
  /** @type {null | Record<string, any>} */
  let current = null;

  const finalize = () => {
    if (current === null) return;
    const patch = current.hunks.join('\n');
    const capped = patch.length > MAX_FILE_PATCH_CHARS
      ? `${patch.slice(0, lastNewlineBefore(patch, MAX_FILE_PATCH_CHARS))}\n…（该文件 patch 已截断）`
      : patch;
    files.push({
      path: current.path,
      oldPath: current.oldPath,
      status: current.status,
      binary: current.binary,
      additions: current.additions,
      deletions: current.deletions,
      patch: capped,
      patchOmitted: capped.length < patch.length,
    });
    current = null;
  };

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      finalize();
      const header = parseGitHeader(line);
      current = {
        path: header.path,
        oldPath: header.oldPath,
        status: 'modified',
        binary: false,
        additions: 0,
        deletions: 0,
        hunks: [],
        inHunks: false,
      };
      continue;
    }
    if (current === null) continue;

    if (line.startsWith('new file mode ')) {
      current.status = 'added';
      continue;
    }
    if (line.startsWith('deleted file mode ')) {
      current.status = 'deleted';
      continue;
    }
    if (line.startsWith('rename from ')) {
      current.status = 'renamed';
      current.oldPath = unquoteGitPath(line.slice('rename from '.length));
      continue;
    }
    if (line.startsWith('rename to ')) {
      current.status = 'renamed';
      current.path = unquoteGitPath(line.slice('rename to '.length));
      continue;
    }
    if (line.startsWith('copy from ')) {
      current.status = 'added';
      current.oldPath = unquoteGitPath(line.slice('copy from '.length));
      continue;
    }
    if (line.startsWith('copy to ')) {
      current.path = unquoteGitPath(line.slice('copy to '.length));
      continue;
    }
    if (line.startsWith('Binary files ') || line === 'GIT binary patch' || line.startsWith('Binary file ')) {
      current.binary = true;
      continue;
    }
    if (line.startsWith('@@')) {
      current.inHunks = true;
      current.hunks.push(line);
      continue;
    }
    if (!current.inHunks) continue;

    current.hunks.push(line);
    if (line.startsWith('+')) current.additions += 1;
    else if (line.startsWith('-')) current.deletions += 1;
  }
  finalize();
  return files;
}

/**
 * 返回不超过 `limit` 的最后一个换行位置，避免从行中间截断。
 *
 * @param {string} text
 * @param {number} limit
 * @returns {number}
 */
function lastNewlineBefore(text, limit) {
  const index = text.lastIndexOf('\n', limit);
  return index > 0 ? index : Math.min(limit, text.length);
}

/**
 * 判断一段缓冲区是否像二进制。
 *
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function looksBinary(bytes) {
  const end = Math.min(bytes.length, 8192);
  for (let index = 0; index < end; index += 1) {
    if (bytes[index] === 0) return true;
  }
  return false;
}

/**
 * 为未跟踪文件合成一段 git 风格的 new-file diff。
 *
 * @param {string} relativePath 仓库内相对路径（正斜杠）。
 * @param {string} content 文本内容；null 表示二进制/不可读。
 * @returns {string}
 */
export function buildUntrackedPatch(relativePath, content) {
  const path = relativePath.replaceAll('\\', '/');
  const header = [
    `diff --git a/${path} b/${path}`,
    'new file mode 100644',
  ];
  if (content === null) {
    header.push(`Binary files /dev/null and b/${path} differ`);
    return header.join('\n');
  }
  header.push('--- /dev/null', `+++ b/${path}`);
  const lines = content.split(/\r?\n/u);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  if (lines.length === 0) return header.join('\n');
  const body = [`@@ -0,0 +1,${lines.length} @@`, ...lines.map(line => `+${line}`)];
  return [...header, ...body].join('\n');
}

/**
 * 汇总所有文件的增删行数。
 *
 * @param {Array<{additions: number, deletions: number}>} files
 * @returns {{files: number, additions: number, deletions: number}}
 */
export function diffStats(files) {
  return {
    files: files.length,
    additions: files.reduce((sum, file) => sum + (Number(file.additions) || 0), 0),
    deletions: files.reduce((sum, file) => sum + (Number(file.deletions) || 0), 0),
  };
}

/**
 * 按 prompt 预算裁剪完整 diff 文本。
 *
 * @param {string} text
 * @returns {{text: string, truncated: boolean}}
 */
export function clipDiffForPrompt(text) {
  if (text.length <= MAX_DIFF_CHARS) return { text, truncated: false };
  const cut = lastNewlineBefore(text, MAX_DIFF_CHARS);
  return {
    text: `${text.slice(0, cut)}\n\n…（diff 已截断：原始 ${text.length} 字符，仅保留前 ${cut} 字符用于审查）`,
    truncated: true,
  };
}
