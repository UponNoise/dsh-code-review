/**
 * 客户端半的离线渲染冒烟：用极简 React 桩执行 client.js 的 factory、apply 和页面组件。
 *
 * 目的不是替代浏览器，而是抓「页面一渲染就抛异常」这类低级错误。
 * 运行：`node scripts/test-client-render.mjs`
 *
 * @module @uponnoise/dsh-code-review/scripts/test-client-render
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

let factory = null;
const sandbox = {
  window: { __ModuleLoader__: { load: definition => { factory = definition.factory; } } },
  console,
  TextDecoder,
  URL,
  Intl,
  Date,
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  Promise,
  Symbol,
  Map,
  Set,
  navigator: {},
  setTimeout,
  clearTimeout,
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'client.js' });

if (typeof factory !== 'function') {
  console.error('factory was not registered');
  process.exit(1);
}

const jsx = (type, props) => ({ type, props: props ?? {} });
const jsxs = jsx;

let stateCursor = 0;
const ReactMock = {
  useState(initial) {
    stateCursor += 1;
    return [typeof initial === 'function' ? initial() : initial, () => {}];
  },
  useEffect() {},
  useRef(initial) { return { current: initial }; },
  useCallback(fn) { return fn; },
  useMemo(fn) { return fn(); },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
  createElement: jsx,
};

function requireMock(id) {
  if (id === 'react') return ReactMock;
  if (id === 'react/jsx-runtime') return { jsx, jsxs, Fragment: Symbol('Fragment') };
  throw new Error(`unexpected require: ${id}`);
}

const registrations = [];
const workspacesStore = {
  subscribe: () => () => {},
  getSnapshot: () => ({
    items: [{ workspaceId: 'w1', path: 'C:\\repo', title: 'repo', sessionIds: [] }],
  }),
};
const sessionsStore = {
  subscribe: () => () => {},
  getSnapshot: () => ({ byId: {} }),
};
const locale = {
  register: () => () => {},
  bind: () => (key, params) => {
    let text = key;
    if (params !== undefined && params !== null) {
      for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  },
  subscribe: () => () => {},
  getSnapshot: () => ({ active: 'zh' }),
};
const slots = {
  inject(_name, callback) { callback(); },
  register(options, component) {
    registrations.push({ options, component });
    return () => {};
  },
};
const ctx = {
  effect(callback) { callback(); },
  locale,
  slots,
  get(name) {
    if (name === 'workspaces') return { list: workspacesStore };
    if (name === 'sessions') return { list: sessionsStore };
    return undefined;
  },
};

const moduleExports = factory(requireMock);
moduleExports.apply(ctx);

const sidebar = registrations.find(entry => entry.options.name === 'sidebar.panellist');
const main = registrations.find(entry => entry.options.name === 'main' && entry.options.key === 'code-review');
if (!sidebar || !main) {
  console.error('slot registrations missing', registrations.map(entry => entry.options));
  process.exit(1);
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

let nodeCount = 0;
function render(node, depth = 0) {
  if (depth > 80) throw new Error('render recursion too deep');
  if (node === null || node === undefined || node === false || node === true) return '';
  nodeCount += 1;
  if (Array.isArray(node)) return node.map(child => render(child, depth + 1)).join('');
  if (typeof node === 'string' || typeof node === 'number') return escapeHtml(String(node));
  if (typeof node.type === 'function') return render(node.type(node.props), depth + 1);
  const children = node.props?.children;
  const className = typeof node.props?.className === 'string' ? ` class="${escapeHtml(node.props.className)}"` : '';
  return `<${String(node.type)}${className}>${render(children, depth + 1)}</${String(node.type)}>`;
}

try {
  const nav = render({ type: sidebar.component, props: { size: 20, active: false } });
  const page = render({ type: main.component, props: {} });
  const pageAgain = render({ type: main.component, props: {} });
  if (!page.includes('cr-page')) throw new Error('page root class missing');
  if (!nav.includes('<span>')) throw new Error('nav icon did not render');
  console.log(`ok   sidebar icon rendered (${nav.length} chars)`);
  console.log(`ok   page rendered (${page.length} chars, repeated ${pageAgain.length} chars)`);
  console.log(`ok   nodes visited: ${nodeCount}`);

  const internals = moduleExports.__internals;
  if (internals === undefined) throw new Error('__internals missing');

  const t = key => key;
  const sampleResult = {
    parsed: true,
    findings: [
      {
        title: 'Addition function now performs subtraction',
        rawTitle: '[P1] Addition function now performs subtraction',
        priority: 1,
        body: 'The `add` function returns `a - b`.',
        confidenceScore: 0.99,
        file: 'app.js',
        absolutePath: 'C:/repo/app.js',
        lineStart: 1,
        lineEnd: 1,
      },
    ],
    overallCorrectness: 'patch is incorrect',
    overallExplanation: 'The patch breaks addition.',
    counts: { P0: 0, P1: 1, P2: 0, P3: 0, unknown: 0 },
    markdown: 'markdown',
    rawText: '{"findings":[]}',
  };
  const resultHtml = render({
    type: internals.ReviewResult,
    props: {
      result: sampleResult,
      review: { meta: { model: { model: 'deepseek-flash' }, stats: { files: 1 } }, elapsedMs: 1234 },
      t,
      isZh: true,
      copied: false,
      onCopy: () => {},
      onRetry: () => {},
      onCopyLocation: () => {},
    },
  });
  if (!resultHtml.includes('cr-finding')) throw new Error('finding card did not render');
  if (!resultHtml.includes('Addition function now performs subtraction')) throw new Error('finding title missing');
  console.log(`ok   review result rendered (${resultHtml.length} chars)`);

  const unparsed = render({
    type: internals.ReviewResult,
    props: {
      result: { parsed: false, findings: [], overallCorrectness: null, overallExplanation: 'raw text', counts: {}, rawText: 'raw text', markdown: 'raw text' },
      review: null,
      t,
      isZh: true,
      copied: false,
      onCopy: () => {},
      onRetry: () => {},
      onCopyLocation: () => {},
    },
  });
  if (!unparsed.includes('cr-raw')) throw new Error('raw fallback did not render');
  console.log(`ok   raw fallback rendered (${unparsed.length} chars)`);

  const progress = render({
    type: internals.ReviewProgress,
    props: { review: { text: 'thinking...', thinkingChars: 42, message: 'model' }, t, onCancel: () => {} },
  });
  if (!progress.includes('cr-progress')) throw new Error('progress did not render');
  console.log(`ok   progress rendered (${progress.length} chars)`);

  const markdown = render({
    type: internals.MarkdownLite,
    props: { text: 'hello `code`\n\n```js\nconst x = 1;\n```' },
  });
  if (!markdown.includes('cr-inline-code') || !markdown.includes('cr-codeblock')) throw new Error('markdown lite did not render');
  console.log(`ok   markdown lite rendered (${markdown.length} chars)`);
} catch (error) {
  console.error('FAIL client render');
  console.error(error);
  process.exit(1);
}
