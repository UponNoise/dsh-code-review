/**
 * git 侧能力：仓库探测、分支/提交、diff 收集、未跟踪文件。
 *
 * 所有命令都通过 `execFile` 直传参数（无 shell），路径只作为 `-C` 参数，
 * 不会参与字符串拼接。
 *
 * @module @uponnoise/dsh-code-review/lib/git
 */
import { readFile, stat } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';
import { oneLine, run } from './exec.js';
import {
  buildUntrackedPatch,
  diffStats,
  MAX_UNTRACKED_BYTES,
  MAX_UNTRACKED_FILES,
  looksBinary,
  parseUnifiedDiff,
} from './diff.js';
import { CodeReviewError } from './errors.js';

/**
 * 运行 git（cwd 固定为仓库根）。
 *
 * @param {string} root
 * @param {string[]} args
 * @param {{timeout?: number, maxBuffer?: number}} [options]
 * @returns {ReturnType<typeof run>}
 */
export function git(root, args, options = {}) {
  return run('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, ...options });
}

/**
 * 校验用户给的 revision 不会被当成 git 选项注入。
 *
 * @param {unknown} value
 * @returns {value is string}
 */
export function isSafeRevision(value) {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > 200) return false;
  if (value.startsWith('-')) return false;
  // refs 里本来就不允许出现这些字符；挡掉它们也就挡掉了 shell/选项注入。
  return !/[\s\u0000-\u001f\u007f`$;&|<>'"\\]/u.test(value);
}

/**
 * 解析 GitHub 远程地址。
 *
 * @param {unknown} remoteUrl
 * @returns {{owner: string, repo: string, url: string} | null}
 */
export function parseGitHubRemote(remoteUrl) {
  if (typeof remoteUrl !== 'string') return null;
  const value = remoteUrl.trim().replace(/\.git$/u, '');
  let match = /^https?:\/\/(?:[^@/]+@)?github\.com\/([^/]+)\/([^/]+)\/?$/iu.exec(value);
  if (match === null) match = /^git@github\.com:([^/]+)\/([^/]+)$/iu.exec(value);
  if (match === null) match = /^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+)$/iu.exec(value);
  if (match === null) match = /^git:\/\/github\.com\/([^/]+)\/([^/]+)$/iu.exec(value);
  if (match === null) return null;
  const owner = match[1];
  const repo = match[2];
  if (!owner || !repo) return null;
  return { owner, repo, url: `https://github.com/${owner}/${repo}` };
}

/**
 * 解析 `git status --porcelain=v1 -b` 的第二行起的状态项。
 *
 * @param {string} line
 * @returns {{code: string, path: string} | null}
 */
function parseStatusEntry(line) {
  if (line.length < 4) return null;
  const code = line.slice(0, 2);
  let filePath = line.slice(3);
  const rename = filePath.indexOf(' -> ');
  if (rename >= 0) filePath = filePath.slice(rename + 4);
  return { code, path: filePath };
}

/**
 * 解析 `## main...origin/main [ahead 1, behind 2]`。
 *
 * @param {string} header
 * @returns {{branch: string, upstream: string | null, ahead: number, behind: number}}
 */
function parseStatusHeader(header) {
  const text = header.replace(/^##\s*/u, '').trim();
  let branch = text;
  let upstream = null;
  let ahead = 0;
  let behind = 0;
  const bracket = text.indexOf(' [');
  const head = bracket >= 0 ? text.slice(0, bracket) : text;
  if (bracket >= 0) {
    const meta = text.slice(bracket + 2, text.endsWith(']') ? -1 : undefined);
    const aheadMatch = /ahead (\d+)/u.exec(meta);
    const behindMatch = /behind (\d+)/u.exec(meta);
    if (aheadMatch !== null) ahead = Number(aheadMatch[1]);
    if (behindMatch !== null) behind = Number(behindMatch[1]);
  }
  const dots = head.indexOf('...');
  if (dots >= 0) {
    branch = head.slice(0, dots);
    upstream = head.slice(dots + 3);
  } else if (head.startsWith('No commits yet on ')) {
    branch = head.slice('No commits yet on '.length);
  } else if (head === 'HEAD (no branch)') {
    branch = 'HEAD';
  }
  return { branch, upstream, ahead, behind };
}

/**
 * 判断目录是否存在。
 *
 * @param {string} directory
 * @returns {Promise<boolean>}
 */
async function directoryExists(directory) {
  try {
    const info = await stat(directory);
    return info.isDirectory();
  } catch {
    return false;
  }
}

/**
 * 读仓库上下文；不是 git 仓库时返回 `isGit:false` 而不是抛错。
 *
 * @param {string} inputPath 绝对路径。
 * @returns {Promise<Record<string, any>>}
 */
export async function inspectRepo(inputPath) {
  if (typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new CodeReviewError('path-required', '没有选择工作区目录。');
  }
  const requested = resolve(inputPath.trim());
  if (!(await directoryExists(requested))) {
    throw new CodeReviewError('path-not-found', `目录不存在：${requested}`);
  }
  const top = await git(requested, ['rev-parse', '--show-toplevel']);
  if (!top.ok) {
    return { ok: true, isGit: false, path: requested, error: oneLine(top.stderr) };
  }
  // git 在 Windows 上可能输出 `C:/...`；统一成原生分隔符，后续前缀比较才可靠。
  const root = resolve(top.stdout.trim());
  const [branchResult, headResult, statusResult, remoteListResult, localRefs, remoteRefs, originHead] = await Promise.all([
    git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
    git(root, ['rev-parse', 'HEAD']),
    git(root, ['status', '--porcelain=v1', '-b']),
    git(root, ['remote']),
    git(root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']),
    git(root, ['for-each-ref', '--format=%(refname:short)', 'refs/remotes']),
    git(root, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']),
  ]);

  const branch = branchResult.ok ? branchResult.stdout.trim() : '';
  const detached = branch === 'HEAD' || branch === '';
  const head = headResult.ok ? headResult.stdout.trim() : '';
  const statusLines = statusResult.ok ? statusResult.stdout.split(/\r?\n/u) : [];
  const statusHeader = statusLines[0] ?? '';
  const parsedHeader = parseStatusHeader(statusHeader);
  const changes = statusLines.slice(1).map(parseStatusEntry).filter(Boolean);

  const remoteName = (remoteListResult.ok ? remoteListResult.stdout.split(/\r?\n/u).map(part => part.trim()).filter(Boolean) : [])
    .sort((left, right) => (left === 'origin' ? -1 : right === 'origin' ? 1 : left.localeCompare(right)))[0];
  const remoteUrlResult = remoteName === undefined ? null : await git(root, ['remote', 'get-url', remoteName]);
  const remoteUrl = remoteUrlResult?.ok ? remoteUrlResult.stdout.trim() : null;
  const github = parseGitHubRemote(remoteUrl);

  const localBranches = localRefs.ok
    ? localRefs.stdout.split(/\r?\n/u).map(part => part.trim()).filter(Boolean).sort((left, right) => left.localeCompare(right))
    : [];
  const remoteBranches = remoteRefs.ok
    ? remoteRefs.stdout.split(/\r?\n/u).map(part => part.trim()).filter(ref => ref !== '' && !ref.endsWith('/HEAD')).sort((left, right) => left.localeCompare(right))
    : [];
  const originDefault = originHead.ok
    ? originHead.stdout.trim().replace(/^refs\/remotes\//u, '')
    : null;
  const defaultBase = pickDefaultBase(originDefault, localBranches, remoteBranches);

  const logResult = await git(root, ['log', '-n', '15', '--date=short', '--pretty=format:%h%x1f%ad%x1f%an%x1f%s']);
  const recentCommits = logResult.ok
    ? logResult.stdout.split(/\r?\n/u).filter(Boolean).map(line => {
      const [short, date, author, subject] = line.split('\u001f');
      return { short: short ?? '', date: date ?? '', author: author ?? '', subject: subject ?? '' };
    })
    : [];

  return {
    ok: true,
    isGit: true,
    path: requested,
    root,
    name: github?.repo ?? basename(root),
    branch,
    detached,
    head,
    headShort: head.slice(0, 8),
    upstream: parsedHeader.upstream,
    ahead: parsedHeader.ahead,
    behind: parsedHeader.behind,
    dirty: changes.length > 0,
    changedFiles: changes.length,
    changes: changes.slice(0, 60),
    branches: [
      ...localBranches.map(name => ({ name, remote: false })),
      ...remoteBranches.map(name => ({ name, remote: true })),
    ].slice(0, 120),
    defaultBase,
    remoteName: remoteName ?? null,
    remoteUrl,
    github,
    recentCommits,
  };
}

/**
 * 选一个最像「PR 基线」的分支。
 *
 * @param {string | null} originDefault
 * @param {string[]} localBranches
 * @param {string[]} remoteBranches
 * @returns {string}
 */
function pickDefaultBase(originDefault, localBranches, remoteBranches) {
  const candidates = [
    originDefault,
    localBranches.includes('main') ? 'main' : null,
    localBranches.includes('master') ? 'master' : null,
    remoteBranches.includes('origin/main') ? 'origin/main' : null,
    remoteBranches.includes('origin/master') ? 'origin/master' : null,
    localBranches[0] ?? null,
    remoteBranches[0] ?? null,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '') return candidate;
  }
  return '';
}

/**
 * 收集未跟踪文件的内容（受数量/体积上限）。
 *
 * @param {string} root
 * @returns {Promise<Array<{path: string, size: number, binary: boolean, content: string | null, skipped?: string}>>}
 */
export async function listUntrackedFiles(root) {
  const listed = await git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  if (!listed.ok) return [];
  const paths = listed.stdout.split('\u0000').filter(Boolean).slice(0, MAX_UNTRACKED_FILES);
  const files = [];
  for (const relative of paths) {
    const absolute = resolve(root, relative);
    if (!absolute.startsWith(`${root}${sep}`) && absolute !== root) continue;
    try {
      const info = await stat(absolute);
      if (!info.isFile()) continue;
      if (info.size > MAX_UNTRACKED_BYTES) {
        files.push({ path: relative.replaceAll('\\', '/'), size: info.size, binary: false, content: null, skipped: 'too-large' });
        continue;
      }
      const buffer = await readFile(absolute);
      const binary = looksBinary(buffer);
      files.push({
        path: relative.replaceAll('\\', '/'),
        size: info.size,
        binary,
        content: binary ? null : buffer.toString('utf8'),
      });
    } catch {
      files.push({ path: relative.replaceAll('\\', '/'), size: 0, binary: false, content: null, skipped: 'unreadable' });
    }
  }
  return files;
}

/**
 * 收集本地审查目标的 diff。
 *
 * @param {{path: string, mode?: 'uncommitted'|'base'|'commit'|'custom', base?: string, commit?: string}} input
 * @returns {Promise<Record<string, any>>}
 */
export async function collectLocalDiff({ path, mode = 'uncommitted', base, commit }) {
  const repo = await inspectRepo(path);
  if (repo.isGit !== true) {
    throw new CodeReviewError('not-a-git-repository', '当前工作区不是 Git 仓库，无法收集 diff。');
  }
  const root = repo.root;
  let diffText = '';
  let title = '未提交的更改';
  let subtitle = `${repo.branch || 'HEAD'} · ${repo.headShort || '无提交'}`;
  let mergeBase = '';
  let commitTitle = '';

  if (mode === 'base') {
    if (!isSafeRevision(base)) throw new CodeReviewError('invalid-base', '基线分支名不合法。');
    const verified = await git(root, ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`]);
    if (!verified.ok) throw new CodeReviewError('unknown-base', `找不到基线分支：${base}`);
    const baseCommit = verified.stdout.trim();
    const merge = await git(root, ['merge-base', baseCommit, 'HEAD']);
    if (merge.ok) mergeBase = merge.stdout.trim();
    const diff = await git(root, ['diff', '--no-color', '--no-ext-diff', `${base}...HEAD`]);
    if (!diff.ok) throw new CodeReviewError('diff-failed', oneLine(diff.stderr) || 'git diff 失败。');
    diffText = diff.stdout;
    title = `对比基线 ${base}`;
    subtitle = `merge-base(${base}, HEAD) → HEAD`;
  } else if (mode === 'commit') {
    if (!isSafeRevision(commit)) throw new CodeReviewError('invalid-commit', '提交号不合法。');
    const verified = await git(root, ['rev-parse', '--verify', '--end-of-options', `${commit}^{commit}`]);
    if (!verified.ok) throw new CodeReviewError('unknown-commit', `找不到提交：${commit}`);
    const sha = verified.stdout.trim();
    // `git show` 对根提交（父提交不存在）和普通提交都给出正确变更集；
    // `--first-parent` 让 merge commit 按第一父提交展示，而不是空 diff。
    const diff = await git(root, ['show', '--format=', '--no-color', '--no-ext-diff', '--first-parent', sha]);
    if (!diff.ok) {
      throw new CodeReviewError('diff-failed', oneLine(diff.stderr) || '读取提交失败。');
    }
    diffText = diff.stdout;
    const subjectResult = await git(root, ['show', '-s', '--format=%s', sha]);
    commitTitle = subjectResult.ok ? subjectResult.stdout.trim() : '';
    title = `提交 ${sha.slice(0, 8)}`;
    subtitle = commitTitle || sha;
  } else {
    // uncommitted / custom：暂存 + 未暂存 + 未跟踪。
    const headDiff = await git(root, ['diff', '--no-color', '--no-ext-diff', 'HEAD']);
    if (headDiff.ok) {
      diffText = headDiff.stdout;
    } else {
      // 空仓库还没有 HEAD：把暂存区和暂存区之后的改动拼起来。
      const [cached, worktree] = await Promise.all([
        git(root, ['diff', '--no-color', '--no-ext-diff', '--cached']),
        git(root, ['diff', '--no-color', '--no-ext-diff']),
      ]);
      diffText = `${cached.ok ? cached.stdout : ''}${worktree.ok ? worktree.stdout : ''}`;
    }
    if (repo.head) subtitle = `${repo.branch || 'HEAD'} · ${repo.headShort}`;
  }

  const includeUntracked = mode === 'uncommitted' || mode === 'custom';
  const untracked = includeUntracked ? await listUntrackedFiles(root) : [];
  if (untracked.length > 0) {
    const patches = untracked.filter(file => file.skipped === undefined).map(file => buildUntrackedPatch(file.path, file.binary ? null : file.content));
    if (patches.length > 0) {
      diffText = `${diffText.trimEnd()}\n\n${patches.join('\n\n')}\n`;
    }
  }

  const files = parseUnifiedDiff(diffText);
  return {
    ok: true,
    kind: 'local',
    mode,
    repo,
    title,
    subtitle,
    mergeBase,
    commitTitle,
    diffText,
    files,
    untracked: untracked.map(file => ({
      path: file.path,
      size: file.size,
      binary: file.binary,
      skipped: file.skipped ?? null,
    })),
    stats: diffStats(files),
  };
}
