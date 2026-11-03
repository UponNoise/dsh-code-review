/**
 * 本机只读集成自检：真实仓库 + 真实 gh。不写任何文件，不调用模型。
 *
 * 运行：`node scripts/test-integration.mjs [repo...]`
 * 不传仓库时只检查当前目录；GitHub 仓库/登录名用环境变量覆盖：
 *   CR_TEST_GITHUB_REPO=owner/repo CR_TEST_LOGIN=owner
 *
 * @module @uponnoise/dsh-code-review/scripts/test-integration
 */
import { inspectRepo, collectLocalDiff } from '../lib/git.js';
import { githubOverview } from '../lib/github.js';

const repos = process.argv.slice(2);
if (repos.length === 0) repos.push(process.cwd());

for (const path of repos) {
  console.log(`\n=== ${path} ===`);
  try {
    const context = await inspectRepo(path);
    console.log(JSON.stringify({
      isGit: context.isGit,
      root: context.root,
      branch: context.branch,
      head: context.headShort,
      dirty: context.dirty,
      changedFiles: context.changedFiles,
      github: context.github,
      defaultBase: context.defaultBase,
      branches: context.branches?.slice(0, 6),
      recentCommits: context.recentCommits?.slice(0, 2),
    }, null, 2));
    if (context.isGit) {
      for (const mode of ['uncommitted', 'base', 'commit']) {
        try {
          const diff = await collectLocalDiff({
            path,
            mode,
            base: mode === 'base' ? context.defaultBase : undefined,
            commit: mode === 'commit' ? context.recentCommits?.[0]?.short : undefined,
          });
          console.log(`  ${mode}: ${diff.files.length} files, +${diff.stats.additions} -${diff.stats.deletions}, diffChars=${diff.diffText.length}, mergeBase=${diff.mergeBase || '-'}`);
        } catch (error) {
          console.log(`  ${mode}: ERROR ${error?.code ?? ''} ${error?.message ?? error}`);
        }
      }
    }
  } catch (error) {
    console.log(`  ERROR ${error?.code ?? ''} ${error?.message ?? error}`);
  }
}

const githubRepo = process.env.CR_TEST_GITHUB_REPO ?? '';
const login = process.env.CR_TEST_LOGIN ?? '';
console.log('\n=== GitHub overview ===');
try {
  const overview = await githubOverview({ repo: githubRepo, login });
  console.log(JSON.stringify({
    ok: overview.ok,
    code: overview.code,
    login: overview.login,
    user: overview.user,
    myPrs: overview.myPrs?.length,
    repoPrs: overview.repoPrs?.length,
    errors: overview.errors,
    gh: overview.gh,
  }, null, 2));
} catch (error) {
  console.log(`  ERROR ${error?.code ?? ''} ${error?.message ?? error}`);
}
