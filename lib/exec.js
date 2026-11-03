/**
 * 最小的进程执行封装：给 git / gh 共用。
 *
 * 只暴露 `execFile`（无 shell），参数数组由调用方完全控制，
 * 因此不存在命令拼接注入；超时后子进程会被杀掉并返回 `ok:false`。
 *
 * @module @uponnoise/dsh-code-review/lib/exec
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** 默认最大缓冲：32 MiB，足够容纳大仓库的整段 diff。 */
const DEFAULT_MAX_BUFFER = 32 * 1024 * 1024;

/**
 * 运行一个可执行文件，绝不经过 shell。
 *
 * @param {string} command 可执行文件路径或 PATH 中的名字。
 * @param {string[]} args 参数数组。
 * @param {{cwd?: string, timeout?: number, maxBuffer?: number, env?: Record<string, string>}} [options]
 * @returns {Promise<{ok: true, stdout: string, stderr: string} | {ok: false, stdout: string, stderr: string, code: unknown, message: string}>}
 */
export async function run(command, args, options = {}) {
  const { cwd, timeout = 20_000, maxBuffer = DEFAULT_MAX_BUFFER, env } = options;
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      timeout,
      maxBuffer,
      windowsHide: true,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
    return { ok: true, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  } catch (error) {
    return {
      ok: false,
      stdout: typeof error?.stdout === 'string' ? error.stdout : '',
      stderr: typeof error?.stderr === 'string' ? error.stderr : '',
      code: error?.code,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 可执行文件是否存在且能响应 `--version`。
 *
 * @param {string} command 路径或命令名。
 * @param {string[]} [versionArgs]
 * @returns {Promise<string | null>} 版本输出首行，失败为 null。
 */
export async function probeExecutable(command, versionArgs = ['--version']) {
  const result = await run(command, versionArgs, { timeout: 10_000 });
  if (!result.ok) return null;
  const line = result.stdout.split(/\r?\n/u).map(part => part.trim()).find(Boolean);
  return line ?? '';
}

/**
 * 把一段可能很长的 stderr 压成一行，给用户看的错误文案。
 *
 * @param {string} text
 * @param {number} [limit]
 * @returns {string}
 */
export function oneLine(text, limit = 400) {
  const flat = String(text ?? '').replace(/\s+/gu, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat;
}
