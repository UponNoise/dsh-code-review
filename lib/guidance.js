/**
 * 从仓库里收集 `AGENTS.override.md` / `AGENTS.md` 作为审查规则（对标 Codex 的
 * Repository Rule Attribution）。
 *
 * 只读、限量：根目录优先，其次变更文件所在目录；单个 24 KiB，总计 48 KiB。
 *
 * @module @uponnoise/dsh-code-review/lib/guidance
 */
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const MAX_FILE_BYTES = 24 * 1024;
const MAX_TOTAL_BYTES = 48 * 1024;
const MAX_FILES = 6;
const MAX_DIRS = 6;

/** 项目指令文件名，override 优先。 */
const FILE_NAMES = ['AGENTS.override.md', 'AGENTS.md'];

/**
 * @param {string} root 仓库根（原生路径）。
 * @param {Array<{path: string}>} changedFiles diff 里的文件列表（仓库相对路径）。
 * @returns {Promise<Array<{path: string, content: string}>>}
 */
export async function collectRepositoryGuidance(root, changedFiles) {
  const dirs = new Set();
  for (const file of changedFiles.slice(0, 80)) {
    const relativeDir = dirname(String(file.path).replaceAll('\\', '/'));
    if (relativeDir === '.' || relativeDir === '') continue;
    const absolute = resolve(root, relativeDir);
    if (!absolute.startsWith(root)) continue;
    // 收集变更文件所在目录及其到根的各级父目录（最多 MAX_DIRS 个）。
    let cursor = absolute;
    while (cursor.length > root.length && dirs.size < MAX_DIRS) {
      dirs.add(cursor);
      cursor = dirname(cursor);
    }
  }

  const orderedDirs = [root, ...[...dirs].sort((left, right) => left.length - right.length)];
  const results = [];
  const seenDirs = new Set();
  let total = 0;

  for (const dir of orderedDirs) {
    if (seenDirs.has(dir)) continue;
    seenDirs.add(dir);
    for (const name of FILE_NAMES) {
      const absolute = join(dir, name);
      try {
        const info = await stat(absolute);
        if (!info.isFile() || info.size > MAX_FILE_BYTES) continue;
      } catch {
        continue;
      }
      if (name === 'AGENTS.md' && results.some(entry => entry.dir === dir)) break;
      if (total + 1 > MAX_TOTAL_BYTES) return results;
      let content;
      try {
        content = await readFile(absolute, 'utf8');
      } catch {
        continue;
      }
      const clipped = content.length > MAX_FILE_BYTES
        ? `${content.slice(0, MAX_FILE_BYTES)}\n…（指导文件已截断）`
        : content;
      if (total + clipped.length > MAX_TOTAL_BYTES) return results;
      total += clipped.length;
      results.push({
        path: absolute.slice(root.length + 1).replaceAll('\\', '/'),
        dir,
        content: clipped,
      });
      if (results.length >= MAX_FILES) return results;
      if (name === 'AGENTS.override.md') break;
    }
  }
  return results;
}
