/**
 * Host 半的离线自检：只跑纯函数和本机只读命令，不需要 DSH 运行时。
 *
 * 运行：`node scripts/test-host.mjs`
 *
 * @module @uponnoise/dsh-code-review/scripts/test-host
 */
import assert from 'node:assert/strict';
import {
  buildUntrackedPatch,
  looksBinary,
  parseUnifiedDiff,
  unquoteGitPath,
  diffStats,
} from '../lib/diff.js';
import { parseGitHubRemote, isSafeRevision } from '../lib/git.js';
import { modeInstruction, formatReviewMarkdown } from '../lib/prompt.js';
import { extractReviewJson, parseReviewText } from '../lib/review.js';

let passed = 0;
let failed = 0;

/**
 * @param {string} label
 * @param {() => void | Promise<void>} fn
 */
async function test(label, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok   ${label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${label}`);
    console.error(error);
  }
}

const SAMPLE_DIFF = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,5 +1,7 @@
 const x = 1;
-const y = 2;
+const y = 3;
+const z = 4;
 export { x, y };
diff --git a/old name.txt b/new name.txt
similarity index 100%
rename from old name.txt
rename to new name.txt
diff --git a/logo.png b/logo.png
index 3333333..4444444 100644
Binary files a/logo.png and b/logo.png differ
diff --git a/new.txt b/new.txt
new file mode 100644
--- /dev/null
+++ b/new.txt
@@ -0,0 +1,2 @@
+hello
+world
`;

await test('parseUnifiedDiff：普通修改/重命名/二进制/新文件', () => {
  const files = parseUnifiedDiff(SAMPLE_DIFF);
  assert.equal(files.length, 4);
  assert.equal(files[0].path, 'src/app.ts');
  assert.equal(files[0].additions, 2);
  assert.equal(files[0].deletions, 1);
  assert.equal(files[1].status, 'renamed');
  assert.equal(files[1].oldPath, 'old name.txt');
  assert.equal(files[1].path, 'new name.txt');
  assert.equal(files[2].binary, true);
  assert.equal(files[3].status, 'added');
  assert.equal(files[3].additions, 2);
  assert.deepEqual(diffStats(files), { files: 4, additions: 4, deletions: 1 });
});

await test('unquoteGitPath：中文八进制转义保持顺序', () => {
  // 字节序列：中(344 270 255)文(346 226 207)
  const decoded = unquoteGitPath('"a/\\344\\270\\255\\346\\226\\207.txt"');
  assert.equal(decoded, 'a/中文.txt');
});

await test('buildUntrackedPatch：文本与二进制', () => {
  const textPatch = buildUntrackedPatch('docs/a.md', 'one\ntwo\n');
  assert.match(textPatch, /new file mode 100644/u);
  assert.match(textPatch, /@@ -0,0 \+1,2 @@/u);
  assert.match(textPatch, /\+one/u);
  const binaryPatch = buildUntrackedPatch('img/logo.png', null);
  assert.match(binaryPatch, /Binary files \/dev\/null and b\/img\/logo\.png differ/u);
});

await test('looksBinary：NUL 判定', () => {
  assert.equal(looksBinary(Uint8Array.from([1, 2, 3])), false);
  assert.equal(looksBinary(Uint8Array.from([1, 0, 3])), true);
});

await test('parseGitHubRemote：https / ssh / 非 GitHub', () => {
  assert.deepEqual(parseGitHubRemote('https://github.com/UponNoise/Quant.git'), {
    owner: 'UponNoise', repo: 'Quant', url: 'https://github.com/UponNoise/Quant',
  });
  assert.deepEqual(parseGitHubRemote('git@github.com:UponNoise/dsh-groupchat.git'), {
    owner: 'UponNoise', repo: 'dsh-groupchat', url: 'https://github.com/UponNoise/dsh-groupchat',
  });
  assert.equal(parseGitHubRemote('https://gitlab.com/a/b.git'), null);
});

await test('isSafeRevision：挡掉选项注入与空白', () => {
  assert.equal(isSafeRevision('main'), true);
  assert.equal(isSafeRevision('origin/main'), true);
  assert.equal(isSafeRevision('--output=/tmp/x'), false);
  assert.equal(isSafeRevision('-p'), false);
  assert.equal(isSafeRevision('a b'), false);
  assert.equal(isSafeRevision(''), false);
});

await test('modeInstruction：逐字复刻 Codex 的四个模式', () => {
  const uncommitted = 'Review the current code changes (staged, unstaged, and untracked files) and provide prioritized findings.';
  assert.equal(modeInstruction({ mode: 'uncommitted' }), uncommitted);
  assert.match(modeInstruction({ mode: 'base', base: 'main', mergeBase: 'abc123' }), /base branch 'main'/u);
  assert.match(modeInstruction({ mode: 'base', base: 'main', mergeBase: 'abc123' }), /merge base commit for this comparison is abc123/u);
  assert.match(modeInstruction({ mode: 'commit', commit: 'deadbeef', commitTitle: 'fix: x' }), /commit deadbeef \("fix: x"\)/u);
  assert.equal(modeInstruction({ mode: 'custom', instructions: '只看安全问题' }), '只看安全问题');
});

await test('extractReviewJson：整段 / 围栏 / 花括号 / 原文', () => {
  const payload = '{"findings":[],"overall_correctness":"patch is correct","overall_explanation":"ok","overall_confidence_score":0.5}';
  assert.equal(extractReviewJson(payload).mode, 'direct');
  assert.equal(extractReviewJson(`\`\`\`json\n${payload}\n\`\`\``).mode, 'fenced');
  assert.equal(extractReviewJson(`前言\n${payload}\n后记`).mode, 'braces');
  assert.equal(extractReviewJson('not json').mode, 'none');
});

await test('parseReviewText：Codex 示例输出映射到 UI 结构', () => {
  const raw = JSON.stringify({
    findings: [
      {
        title: '[P1] Reject empty tenant IDs before cache lookup',
        body: '`get_tenant` derives the cache key from the raw header.',
        confidence_score: 0.86,
        priority: 1,
        code_location: { absolute_file_path: '/repo/src/tenant/cache.rs', line_range: { start: 142, end: 151 } },
      },
      {
        title: '[P2] 第二个问题',
        body: 'body',
        priority: 2,
        code_location: { absolute_file_path: '/repo/b.ts', line_range: { start: 3, end: 3 } },
      },
    ],
    overall_correctness: 'patch is incorrect',
    overall_explanation: 'The cache-key change drops input validation.',
    overall_confidence_score: 0.8,
  });
  const result = parseReviewText(raw, { root: '/repo' });
  assert.equal(result.parsed, true);
  assert.equal(result.overallCorrectness, 'patch is incorrect');
  assert.equal(result.findings.length, 2);
  assert.equal(result.findings[0].priority, 1);
  assert.equal(result.findings[0].title, 'Reject empty tenant IDs before cache lookup');
  assert.equal(result.findings[0].file, 'src/tenant/cache.rs');
  assert.equal(result.findings[0].absolutePath, '/repo/src/tenant/cache.rs');
  assert.equal(result.findings[0].lineStart, 142);
  assert.equal(result.findings[0].lineEnd, 151);
  assert.equal(result.findings[1].priority, 2);
});

await test('parseReviewText：坏 JSON 退化到原文解释', () => {
  const result = parseReviewText('模型自由发挥的一段话');
  assert.equal(result.parsed, false);
  assert.equal(result.findings.length, 0);
  assert.equal(result.overallExplanation, '模型自由发挥的一段话');
});

await test('formatReviewMarkdown：复刻 Codex 的 Review comment 渲染', () => {
  const single = formatReviewMarkdown({
    findings: [{
      rawTitle: '[P1] Fix it',
      title: 'Fix it',
      priority: 1,
      body: 'line one\nline two',
      absolutePath: '/repo/a.ts',
      lineStart: 3,
      lineEnd: 4,
    }],
    overallExplanation: 'Something is wrong.',
    overallCorrectness: 'patch is incorrect',
  });
  assert.equal(single, [
    'Something is wrong.',
    '',
    'Review comment:',
    '',
    '- [P1] Fix it — /repo/a.ts:3-4',
    '  line one',
    '  line two',
  ].join('\n'));

  const empty = formatReviewMarkdown({ findings: [], overallExplanation: '', overallCorrectness: null });
  assert.equal(empty, 'Reviewer failed to output a response.');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
