/**
 * 真实端到端自检：向运行中的 DSH 发一次审查请求，打印 NDJSON 事件。
 *
 * 用法：`node scripts/test-live.mjs <repo-path> [uncommitted|base|commit] [base]`
 * 只读仓库；会调用当前 profile 配置的模型（产生 token 消耗）。
 *
 * @module @uponnoise/dsh-code-review/scripts/test-live
 */
const baseUrl = process.env.DSH_WEB_URL || 'http://127.0.0.1:64266';
const target = process.argv[2];
const mode = process.argv[3] || 'uncommitted';
const base = process.argv[4];

if (!target) {
  console.error('usage: node scripts/test-live.mjs <repo-path|pr:owner/repo#number> [mode] [base]');
  process.exit(2);
}

let body;
const prMatch = /^pr:([^#]+)#(\d+)$/u.exec(target);
if (prMatch !== null) {
  body = { source: { kind: 'pr', repo: prMatch[1], number: Number(prMatch[2]) } };
} else {
  body = { path: target, mode, base };
}

const started = Date.now();
const response = await fetch(`${baseUrl}/dsh-code-review/api/review`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
  body: JSON.stringify(body),
});

console.log(`HTTP ${response.status} ${response.headers.get('content-type')}`);
if (!response.ok) {
  console.log(await response.text());
  process.exit(1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let deltas = 0;
let chars = 0;

function handle(event) {
  if (event.type === 'delta') {
    deltas += 1;
    chars += String(event.text ?? '').length;
    return;
  }
  if (event.type === 'thinking') return;
  if (event.type === 'result') {
    console.log('\n=== RESULT ===');
    console.log(JSON.stringify({
      parsed: event.result.parsed,
      overallCorrectness: event.result.overallCorrectness,
      overallExplanation: event.result.overallExplanation,
      counts: event.result.counts,
      findings: event.result.findings,
      elapsedMs: event.elapsedMs,
      markdown: event.result.markdown,
    }, null, 2));
    return;
  }
  console.log(JSON.stringify(event));
}

for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  let newline = buffer.indexOf('\n');
  while (newline >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line !== '') {
      try {
        handle(JSON.parse(line));
      } catch {
        console.log('bad line', line.slice(0, 200));
      }
    }
    newline = buffer.indexOf('\n');
  }
}

console.log(`\ndeltas=${deltas} chars=${chars} totalMs=${Date.now() - started}`);
