window.__ModuleLoader__.load({
  id: '@uponnoise/dsh-code-review',
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
    const React = require('react');
    const { jsx, jsxs } = require('react/jsx-runtime');

    const NS = 'code-review';
    const PANEL_ID = 'code-review';
    const API_BASE = 'dsh-code-review/api';

    const zh = {
      'nav.label': '代码审查',
      'page.title': '代码审查',
      'page.subtitle': 'Codex 风格 · 本地 diff 与 GitHub PR',
      'header.refresh': '刷新数据',
      'header.github': '打开 GitHub',
      'workspace.label': '工作区',
      'workspace.loading': '读取仓库…',
      'workspace.none': '还没有工作区',
      'workspace.noneHint': '先在左侧新建或打开一个工作区，再回来审查。',
      'workspace.notGit': '不是 Git 仓库',
      'workspace.notGitHint': '换一个 Git 仓库工作区，或直接选择下方的 GitHub PR。',
      'workspace.clean': '工作区干净',
      'workspace.dirty': '{n} 个文件变更',
      'workspace.behind': '落后 {n}',
      'workspace.ahead': '领先 {n}',
      'workspace.openGithub': '在 GitHub 打开',
      'workspace.localChanges': '本地更改',
      'scope.label': '审查范围',
      'scope.uncommitted': '未提交的更改',
      'scope.uncommittedDesc': '暂存、未暂存和未跟踪的更改',
      'scope.base': '对比基线分支',
      'scope.baseDesc': '以 PR 方式审查 merge-base → HEAD',
      'scope.commit': '指定提交',
      'scope.commitDesc': '审查某个提交引入的更改',
      'scope.custom': '自定义审查',
      'scope.customDesc': '按你的关注点审查未提交更改',
      'scope.baseLabel': '基线分支',
      'scope.commitLabel': '提交',
      'scope.commitPlaceholder': '输入 SHA，或从最近提交里选',
      'scope.customLabel': '审查指令',
      'scope.customPlaceholder': '例如：重点关注并发、错误处理和向后兼容',
      'scope.prTarget': 'GitHub PR',
      'scope.backToLocal': '返回本地更改',
      'scope.prDisabled': '当前工作区不是 Git 仓库，先选择 GitHub PR 或换工作区。',
      'run.label': '开始审查',
      'run.running': '审查中…',
      'run.cancel': '取消审查',
      'run.disabledEmpty': '没有可审查的更改',
      'run.disabledModel': '当前 profile 没有可用的模型服务',
      'run.disabledInstructions': '请先填写自定义审查指令',
      'run.model': '模型',
      'run.hint': 'diff 只发送给当前配置的模型，不会写入 GitHub。',
      'github.title': 'GitHub PR',
      'github.mine': '我的',
      'github.repo': '本仓库',
      'github.empty': '没有开放的 PR',
      'github.emptyHint': '去 GitHub 看看，或者切到「本仓库」。',
      'github.openAll': '在 GitHub 查看全部',
      'github.unavailable': 'GitHub CLI 不可用',
      'github.unavailableHint': '安装并登录 gh 后即可浏览 PR；账号链接仍然可用。',
      'github.loading': '读取 GitHub…',
      'github.refresh': '刷新 PR 列表',
      'github.prBy': '@{author}',
      'tabs.diff': '差异',
      'tabs.review': '审查',
      'tabs.files': '{n} 个文件',
      'diff.loading': '读取 diff…',
      'diff.empty': '没有检测到变更',
      'diff.emptyHint': '换一个范围，或者先在工作区里做一些修改。',
      'diff.binary': '二进制文件，没有文本 diff。',
      'diff.patchOmitted': '该文件的 patch 因体积上限被截断。',
      'diff.untracked': '未跟踪文件',
      'diff.untrackedSkipped': '{n} 个未跟踪文件因体积/可读性被跳过。',
      'diff.note': '提示',
      'diff.pathCopied': '已复制路径',
      'status.added': '新增',
      'status.deleted': '删除',
      'status.renamed': '重命名',
      'status.modified': '修改',
      'status.untracked': '未跟踪',
      'review.idle': '选择审查范围，然后点击「开始审查」。',
      'review.idleHint': 'Codex 风格的审查会输出带 P0–P3 优先级的发现。',
      'review.running': '正在审查…',
      'review.cancel': '取消',
      'review.error': '审查失败',
      'review.cancelled': '审查已取消。',
      'review.retry': '重新审查',
      'review.summary': '概要',
      'review.findings': '发现',
      'review.noFindings': '没有需要修复的问题。',
      'review.verdict.correct': '可合并',
      'review.verdict.incorrect': '需修改',
      'review.verdict.unknown': '未判定',
      'review.confidence': '{n}% 置信',
      'review.copy': '复制 Markdown',
      'review.copied': '已复制',
      'review.copyFailed': '复制失败，请手动选择文本。',
      'review.raw': '查看原始输出',
      'review.hideRaw': '收起原始输出',
      'review.unparsed': '模型没有返回结构化 JSON，以下是原始输出。',
      'review.thinking': '模型思考中 · {n} 字',
      'review.elapsed': '耗时 {s}s',
      'review.model': '模型 {model}',
      'review.truncated': 'diff 已截断后送审',
      'review.livePreview': '实时输出',
      'review.copyLocation': '复制位置',
      'review.parseFailed': '未能解析出结构化结果。',
      'review.stage.collect': '正在收集变更…',
      'review.stage.guidance': '正在载入项目规则…',
      'review.stage.model': '正在请求模型…',
      'review.stage.parse': '正在整理结果…',
      'review.stage.done': '完成',
      'common.loading': '加载中…',
      'common.retry': '重试',
      'common.unknown': '未知',
      'common.error': '出错了',
      'common.close': '关闭',
      'health.error': '无法连接审查服务',
      'health.errorHint': 'Host 路由可能还没挂载；点重试。',
      'empty.workspace': '选择一个工作区开始',
      'empty.workspaceHint': '审查会在本机读取 git diff，不写入任何文件。',
    };

    const en = {
      'nav.label': 'Code Review',
      'page.title': 'Code Review',
      'page.subtitle': 'Codex-style · local diffs and GitHub PRs',
      'header.refresh': 'Refresh data',
      'header.github': 'Open GitHub',
      'workspace.label': 'Workspace',
      'workspace.loading': 'Reading repository…',
      'workspace.none': 'No workspace yet',
      'workspace.noneHint': 'Create or open a workspace on the left, then come back.',
      'workspace.notGit': 'Not a Git repository',
      'workspace.notGitHint': 'Pick a Git workspace, or choose a GitHub PR below.',
      'workspace.clean': 'Working tree clean',
      'workspace.dirty': '{n} changed files',
      'workspace.behind': '{n} behind',
      'workspace.ahead': '{n} ahead',
      'workspace.openGithub': 'Open on GitHub',
      'workspace.localChanges': 'Local changes',
      'scope.label': 'Review scope',
      'scope.uncommitted': 'Uncommitted changes',
      'scope.uncommittedDesc': 'Staged, unstaged, and untracked files',
      'scope.base': 'Against a base branch',
      'scope.baseDesc': 'PR-style review of merge-base → HEAD',
      'scope.commit': 'A specific commit',
      'scope.commitDesc': 'Review the changes introduced by one commit',
      'scope.custom': 'Custom instructions',
      'scope.customDesc': 'Review uncommitted changes with your focus',
      'scope.baseLabel': 'Base branch',
      'scope.commitLabel': 'Commit',
      'scope.commitPlaceholder': 'Paste a SHA, or pick a recent commit',
      'scope.customLabel': 'Instructions',
      'scope.customPlaceholder': 'e.g. focus on concurrency, error handling, compatibility',
      'scope.prTarget': 'GitHub PR',
      'scope.backToLocal': 'Back to local changes',
      'scope.prDisabled': 'This workspace is not a Git repository. Pick a GitHub PR or another workspace.',
      'run.label': 'Start review',
      'run.running': 'Reviewing…',
      'run.cancel': 'Cancel review',
      'run.disabledEmpty': 'Nothing to review',
      'run.disabledModel': 'No model service in this profile',
      'run.disabledInstructions': 'Write custom instructions first',
      'run.model': 'Model',
      'run.hint': 'The diff is sent only to the configured model. Nothing is written to GitHub.',
      'github.title': 'GitHub PRs',
      'github.mine': 'Mine',
      'github.repo': 'This repo',
      'github.empty': 'No open pull requests',
      'github.emptyHint': 'Check GitHub, or switch to "This repo".',
      'github.openAll': 'View all on GitHub',
      'github.unavailable': 'GitHub CLI unavailable',
      'github.unavailableHint': 'Install and sign in to gh to browse PRs; the profile link still works.',
      'github.loading': 'Reading GitHub…',
      'github.refresh': 'Refresh PR list',
      'github.prBy': '@{author}',
      'tabs.diff': 'Diff',
      'tabs.review': 'Review',
      'tabs.files': '{n} files',
      'diff.loading': 'Reading diff…',
      'diff.empty': 'No changes detected',
      'diff.emptyHint': 'Try another scope, or make some changes in the workspace first.',
      'diff.binary': 'Binary file; no text diff.',
      'diff.patchOmitted': 'This file patch was clipped by the size budget.',
      'diff.untracked': 'Untracked files',
      'diff.untrackedSkipped': '{n} untracked files were skipped because of size or readability.',
      'diff.note': 'Note',
      'diff.pathCopied': 'Path copied',
      'status.added': 'Added',
      'status.deleted': 'Deleted',
      'status.renamed': 'Renamed',
      'status.modified': 'Modified',
      'status.untracked': 'Untracked',
      'review.idle': 'Pick a scope, then start the review.',
      'review.idleHint': 'Findings come back with P0–P3 priorities, Codex style.',
      'review.running': 'Reviewing…',
      'review.cancel': 'Cancel',
      'review.error': 'Review failed',
      'review.cancelled': 'Review cancelled.',
      'review.retry': 'Review again',
      'review.summary': 'Summary',
      'review.findings': 'Findings',
      'review.noFindings': 'No actionable findings.',
      'review.verdict.correct': 'Looks correct',
      'review.verdict.incorrect': 'Needs changes',
      'review.verdict.unknown': 'Not judged',
      'review.confidence': '{n}% confidence',
      'review.copy': 'Copy Markdown',
      'review.copied': 'Copied',
      'review.copyFailed': 'Copy failed; select the text manually.',
      'review.raw': 'Show raw output',
      'review.hideRaw': 'Hide raw output',
      'review.unparsed': 'The model did not return structured JSON. Raw output below.',
      'review.thinking': 'Thinking · {n} chars',
      'review.elapsed': '{s}s',
      'review.model': 'Model {model}',
      'review.truncated': 'Diff was truncated for the model',
      'review.livePreview': 'Live output',
      'review.copyLocation': 'Copy location',
      'review.parseFailed': 'Could not parse a structured result.',
      'review.stage.collect': 'Collecting changes…',
      'review.stage.guidance': 'Loading repository guidance…',
      'review.stage.model': 'Calling the model…',
      'review.stage.parse': 'Formatting findings…',
      'review.stage.done': 'Done',
      'common.loading': 'Loading…',
      'common.retry': 'Retry',
      'common.unknown': 'Unknown',
      'common.error': 'Something went wrong',
      'common.close': 'Close',
      'health.error': 'Cannot reach the review service',
      'health.errorHint': 'The host route may not be mounted yet; retry.',
      'empty.workspace': 'Pick a workspace to begin',
      'empty.workspaceHint': 'The review reads git diffs locally and writes no files.',
    };

    const CSS = `
.cr-page{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.cr-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none}
.cr-title{display:flex;align-items:center;gap:12px;min-width:0}
.cr-logo{width:34px;height:34px;flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}
.cr-title h1{margin:0;font-size:16px;font-weight:650;line-height:1.2}
.cr-title p{margin:2px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cr-header-actions{display:flex;align-items:center;gap:8px;flex:none}
.cr-gh-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);text-decoration:none;font-size:12px;font-weight:600;max-width:220px}
.cr-gh-chip:hover{border-color:var(--dsw-alias-border-l2)}
.cr-gh-chip img{width:20px;height:20px;border-radius:50%;flex:none}
.cr-avatar-fallback{width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex:none}
.cr-gh-login{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cr-icon-btn{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.cr-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.cr-icon-btn:focus-visible,.cr-btn:focus-visible,.cr-mode:focus-visible,.cr-tab:focus-visible,.cr-pr:focus-visible,.cr-file:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.cr-body{display:flex;flex:1;min-height:0}
.cr-aside{width:324px;flex:none;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);padding:14px;overflow:auto;display:flex;flex-direction:column;gap:12px}
.cr-section{display:flex;flex-direction:column;gap:8px}
.cr-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.cr-section-title{margin:0;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.cr-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);padding:10px}
.cr-select,.cr-input,.cr-textarea{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);padding:7px 9px;font:inherit;font-size:12.5px;outline:none}
.cr-select{appearance:auto}
.cr-select:focus,.cr-input:focus,.cr-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.cr-textarea{min-height:76px;resize:vertical;line-height:1.5}
.cr-label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.cr-repo{display:flex;flex-direction:column;gap:6px;margin-top:8px;font-size:12px}
.cr-repo-row{display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap}
.cr-repo-name{font-weight:650;color:var(--dsw-alias-label-primary);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-repo-name:hover{text-decoration:underline}
.cr-chip{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 7px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}
.cr-chip.branch{font-family:ui-monospace,SFMono-Regular,"Cascadia Code",Consolas,monospace}
.cr-chip.dirty{color:var(--dsw-alias-state-warn-primary)}
.cr-muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}
.cr-warning{display:flex;gap:8px;align-items:flex-start;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,transparent);border-radius:8px;padding:8px 10px;color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:1.5;background:var(--dsw-alias-bg-base)}
.cr-error{display:flex;gap:8px;align-items:flex-start;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);border-radius:8px;padding:8px 10px;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.5;background:var(--dsw-alias-bg-base)}
.cr-mode{display:flex;flex-direction:column;align-items:flex-start;gap:1px;width:100%;text-align:left;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:8px 10px;cursor:pointer;font:inherit}
.cr-mode:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.cr-mode[data-active="true"]{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.cr-mode:disabled{opacity:.55;cursor:not-allowed}
.cr-mode-title{font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px}
.cr-mode-desc{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.4}
.cr-mode-radio{width:12px;height:12px;border-radius:50%;border:1.5px solid var(--dsw-alias-label-secondary);flex:none;display:inline-flex;align-items:center;justify-content:center}
.cr-mode[data-active="true"] .cr-mode-radio{border-color:var(--dsw-alias-brand-primary)}
.cr-mode[data-active="true"] .cr-mode-radio::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.cr-pr-target{display:flex;flex-direction:column;gap:6px;border:1px solid var(--dsw-alias-brand-primary);border-radius:9px;background:var(--dsw-alias-bg-layer-2);padding:9px 10px}
.cr-pr-target-title{font-size:12.5px;font-weight:600;line-height:1.35}
.cr-pr-target-meta{font-size:11px;color:var(--dsw-alias-label-secondary)}
.cr-pr-target a{color:var(--dsw-alias-brand-primary);text-decoration:none;font-size:11px;display:inline-flex;align-items:center;gap:3px}
.cr-link-btn{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:11.5px;padding:0;cursor:pointer}
.cr-link-btn:hover{text-decoration:underline}
.cr-run{margin-top:2px;display:flex;flex-direction:column;gap:8px}
.cr-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);padding:8px 12px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;text-decoration:none}
.cr-btn:hover{filter:brightness(1.06)}
.cr-btn:disabled{opacity:.5;cursor:not-allowed;filter:none}
.cr-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.cr-btn-danger{color:var(--dsw-alias-state-error-primary)}
.cr-run-hint{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.45}
.cr-model-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.cr-model-chip{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;background:var(--dsw-alias-bg-layer-2);border-radius:6px;padding:2px 6px;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-seg{display:flex;gap:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:2px;background:var(--dsw-alias-bg-base)}
.cr-seg button{flex:1;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;padding:4px 6px;cursor:pointer}
.cr-seg button[data-active="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.cr-pr-list{display:flex;flex-direction:column;gap:4px;max-height:240px;overflow:auto}
.cr-pr-row{display:flex;align-items:stretch;gap:2px;border-radius:8px}
.cr-pr-row:hover{background:var(--dsw-alias-bg-layer-2)}
.cr-pr{display:flex;flex-direction:column;align-items:flex-start;gap:1px;flex:1;min-width:0;text-align:left;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);padding:6px 8px;font:inherit;cursor:pointer}
.cr-pr[data-active="true"]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.cr-pr-title{font-size:12px;font-weight:550;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.cr-pr-meta{font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.cr-pr-open{display:inline-flex;align-items:center;justify-content:center;width:24px;flex:none;border-radius:6px;color:var(--dsw-alias-label-secondary);text-decoration:none}
.cr-pr-open:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.cr-main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base)}
.cr-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none;min-height:46px;box-sizing:border-box}
.cr-target{min-width:0;display:flex;flex-direction:column;gap:1px}
.cr-target-title{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:560px}
.cr-target-sub{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:560px}
.cr-toolbar-right{display:flex;align-items:center;gap:8px;flex:none}
.cr-stats{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.cr-stat-add{color:var(--dsw-alias-state-success-primary);font-weight:600}
.cr-stat-del{color:var(--dsw-alias-state-error-primary);font-weight:600}
.cr-tabs{display:flex;align-items:center;gap:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:2px;background:var(--dsw-alias-bg-base)}
.cr-tab{border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;padding:4px 9px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.cr-tab[data-active="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.cr-badge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--dsw-alias-brand-primary);color:#fff;font-size:10px;font-weight:700}
.cr-badge.muted{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.cr-stage{flex:1;min-height:0;display:flex}
.cr-diff-layout{display:flex;flex:1;min-height:0}
.cr-filelist{width:276px;flex:none;border-right:1px solid var(--dsw-alias-border-l1);overflow:auto;padding:8px;display:flex;flex-direction:column;gap:3px;background:var(--dsw-alias-bg-layer-1)}
.cr-filelist-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 4px 6px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.cr-file{display:grid;grid-template-columns:18px minmax(0,1fr) auto;align-items:center;gap:6px;width:100%;text-align:left;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);padding:5px 6px;font:inherit;cursor:pointer}
.cr-file:hover{background:var(--dsw-alias-bg-layer-2)}
.cr-file[data-active="true"]{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.cr-file-status{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;font-weight:700;text-align:center}
.cr-file-status.added{color:var(--dsw-alias-state-success-primary)}
.cr-file-status.deleted{color:var(--dsw-alias-state-error-primary)}
.cr-file-status.renamed,.cr-file-status.modified{color:var(--dsw-alias-state-warn-primary)}
.cr-file-path{min-width:0;display:flex;flex-direction:column;line-height:1.3}
.cr-file-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cr-file-dir{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cr-file-nums{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.cr-file-nums .a{color:var(--dsw-alias-state-success-primary)}
.cr-file-nums .d{color:var(--dsw-alias-state-error-primary)}
.cr-viewer{flex:1;min-width:0;overflow:auto;background:var(--dsw-alias-bg-base)}
.cr-viewer-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);font-size:12px}
.cr-viewer-path{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-diff{font-family:ui-monospace,SFMono-Regular,"Cascadia Code",Consolas,monospace;font-size:12px;line-height:20px;min-width:max-content;padding-bottom:16px}
.cr-diff-line{display:grid;grid-template-columns:44px 44px 18px minmax(0,1fr);white-space:pre}
.cr-gutter{color:var(--dsw-alias-label-secondary);text-align:right;padding-right:8px;user-select:none;opacity:.7;font-size:11px}
.cr-diff-mark{text-align:center;user-select:none;color:var(--dsw-alias-label-secondary)}
.cr-diff-text{padding-right:16px}
.cr-diff-line.add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 9%,transparent)}
.cr-diff-line.add .cr-diff-mark,.cr-diff-line.add .cr-diff-text{color:var(--dsw-alias-state-success-primary)}
.cr-diff-line.del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent)}
.cr-diff-line.del .cr-diff-mark,.cr-diff-line.del .cr-diff-text{color:var(--dsw-alias-state-error-primary)}
.cr-diff-line.hunk{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}
.cr-diff-line.hunk .cr-diff-text{color:var(--dsw-alias-brand-primary);font-weight:600}
.cr-review{flex:1;overflow:auto;padding:20px 24px 40px}
.cr-review-inner{max-width:940px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.cr-progress{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.cr-progress-head{display:flex;align-items:center;gap:8px;font-weight:600}
.cr-spinner{width:14px;height:14px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);animation:cr-spin 1s linear infinite;flex:none}
@keyframes cr-spin{to{transform:rotate(360deg)}}
.cr-live{max-height:220px;overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:8px 10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:1.5;white-space:pre-wrap;color:var(--dsw-alias-label-secondary)}
.cr-result-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.cr-verdict{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:3px 9px;font-size:11.5px;font-weight:700;border:1px solid transparent}
.cr-verdict.correct{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent)}
.cr-verdict.incorrect{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)}
.cr-verdict.unknown{color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-border-l1)}
.cr-prio-counts{display:flex;align-items:center;gap:5px;margin-left:auto}
.cr-prio-count{display:inline-flex;align-items:center;gap:4px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);padding:2px 6px;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.cr-prio-count strong{font-size:11px;color:var(--dsw-alias-label-primary)}
.cr-summary{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px 14px}
.cr-summary h2,.cr-findings h2{margin:0 0 6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.cr-summary p{margin:0;white-space:pre-wrap;line-height:1.6}
.cr-findings{display:flex;flex-direction:column;gap:8px}
.cr-finding{display:flex;flex-direction:column;gap:7px;border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--dsw-alias-label-secondary);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:11px 13px}
.cr-finding.p0{border-left-color:var(--dsw-alias-state-error-primary)}
.cr-finding.p1{border-left-color:var(--dsw-alias-state-warn-primary)}
.cr-finding.p2{border-left-color:var(--dsw-alias-brand-primary)}
.cr-finding.p3{border-left-color:var(--dsw-alias-label-secondary)}
.cr-finding-head{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
.cr-prio{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:10.5px;font-weight:800;border-radius:5px;padding:1px 5px;border:1px solid var(--dsw-alias-border-l1);flex:none;margin-top:1px}
.cr-prio.p0{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 50%,transparent)}
.cr-prio.p1{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 50%,transparent)}
.cr-prio.p2{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent)}
.cr-prio.p3,.cr-prio.unknown{color:var(--dsw-alias-label-secondary)}
.cr-finding-title{margin:0;font-size:13px;font-weight:650;line-height:1.4;flex:1;min-width:180px}
.cr-confidence{font-size:10.5px;color:var(--dsw-alias-label-secondary);flex:none;margin-top:2px}
.cr-location{border:0;background:transparent;padding:0;color:var(--dsw-alias-brand-primary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;text-align:left;cursor:pointer;overflow-wrap:anywhere}
.cr-location:hover{text-decoration:underline}
.cr-finding-body{font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-primary)}
.cr-paragraph{margin:0 0 6px;white-space:pre-wrap}
.cr-paragraph:last-child{margin-bottom:0}
.cr-inline-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:0 3px}
.cr-codeblock{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:8px 10px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;line-height:1.5;margin:6px 0;white-space:pre}
.cr-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cr-result-meta{font-size:11px;color:var(--dsw-alias-label-secondary);display:flex;gap:10px;flex-wrap:wrap}
.cr-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:56px 24px;color:var(--dsw-alias-label-secondary);flex:1}
.cr-empty-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary)}
.cr-empty-title{font-size:14px;font-weight:650;color:var(--dsw-alias-label-primary)}
.cr-empty-hint{font-size:12px;max-width:420px;line-height:1.6}
.cr-raw{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:10px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:1.5;white-space:pre-wrap;max-height:340px;color:var(--dsw-alias-label-secondary)}
.cr-skeleton{display:flex;flex-direction:column;gap:8px;padding:16px}
.cr-skeleton-bar{height:10px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);animation:cr-pulse 1.4s ease-in-out infinite}
@keyframes cr-pulse{0%,100%{opacity:.55}50%{opacity:1}}
.cr-scroll-thin{scrollbar-width:thin}
.cr-page ::-webkit-scrollbar{width:9px;height:9px}
.cr-page ::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:6px;border:2px solid var(--dsw-alias-bg-base)}
.cr-page ::-webkit-scrollbar-track{background:transparent}
@media (max-width:980px){.cr-aside{width:286px}.cr-target-title,.cr-target-sub{max-width:320px}}
@media (max-width:820px){.cr-body{flex-direction:column}.cr-aside{width:auto;max-height:46vh;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1)}.cr-diff-layout{flex-direction:column}.cr-filelist{width:auto;max-height:190px;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1)}.cr-header{flex-wrap:wrap}.cr-review{padding:14px}}
@media (prefers-reduced-motion:reduce){.cr-spinner{animation:none}.cr-skeleton-bar{animation:none}}
`;

    /* ------------------------------------------------------------------ */
    /* helpers                                                             */
    /* ------------------------------------------------------------------ */

    /** 取可选客户端服务。 */
    function safeGet(ctx, name) {
      try {
        return typeof ctx.get === 'function' ? ctx.get(name) : undefined;
      } catch {
        return undefined;
      }
    }

    /** 相对当前页面目录的 API 路径（兼容反代前缀，与 dshmarket 的 api() 同规则）。 */
    function apiPath(name) {
      const relative = `${API_BASE}/${name}`;
      if (typeof document === 'undefined' || typeof document.baseURI !== 'string') return `/${relative}`;
      try {
        return new URL(relative, document.baseURI).pathname;
      } catch {
        return `/${relative}`;
      }
    }

    /** 统一个错误对象。 */
    function makeError(message, code, status) {
      const error = new Error(message);
      error.code = code;
      error.status = status;
      return error;
    }

    /** 发一次 JSON 请求。 */
    async function request(path, options = {}) {
      const { headers: extraHeaders, ...rest } = options;
      const headers = { accept: 'application/json', ...(extraHeaders ?? {}) };
      if (rest.body !== undefined) headers['content-type'] = 'application/json';
      const response = await fetch(path, { ...rest, headers });
      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('json') ? await response.json().catch(() => null) : null;
      if (!response.ok) {
        throw makeError(payload?.error ?? `HTTP ${response.status}`, payload?.code ?? 'http-error', response.status);
      }
      return payload;
    }

    /** Windows 下路径大小写不敏感。 */
    function samePath(left, right) {
      if (typeof left !== 'string' || typeof right !== 'string') return false;
      const normalize = value => value.replace(/[\\/]+/g, '/').replace(/\/+$/u, '').toLowerCase();
      return normalize(left) === normalize(right);
    }

    /** 空快照，服务缺失时保持 hooks 稳定。 */
    const EMPTY_WORKSPACES = { subscribe: () => () => {}, getSnapshot: () => ({ items: [] }) };
    const EMPTY_SESSIONS = { subscribe: () => () => {}, getSnapshot: () => ({ byId: {} }) };

    /** useSyncExternalStore 的薄封装。 */
    function useObservable(source) {
      const subscribe = React.useCallback(listener => source.subscribe(listener), [source]);
      const getSnapshot = React.useCallback(() => source.getSnapshot(), [source]);
      return React.useSyncExternalStore(subscribe, getSnapshot);
    }

    /** 相对时间。 */
    function relativeTime(iso, isZh) {
      const time = Date.parse(String(iso ?? ''));
      if (!Number.isFinite(time)) return '';
      const delta = time - Date.now();
      const absolute = Math.abs(delta);
      const units = [
        ['year', 31_536_000_000],
        ['month', 2_592_000_000],
        ['day', 86_400_000],
        ['hour', 3_600_000],
        ['minute', 60_000],
      ];
      try {
        const format = new Intl.RelativeTimeFormat(isZh ? 'zh-CN' : 'en', { numeric: 'auto' });
        for (const [unit, ms] of units) {
          if (absolute >= ms) return format.format(Math.round(delta / ms), unit);
        }
        return isZh ? '刚刚' : 'just now';
      } catch {
        return '';
      }
    }

    /** 状态字母与文案。 */
    function statusLetter(status) {
      if (status === 'added') return 'A';
      if (status === 'deleted') return 'D';
      if (status === 'renamed') return 'R';
      return 'M';
    }

    /** 优先级徽标。 */
    function priorityLabel(finding) {
      return finding?.priority === null || finding?.priority === undefined ? 'P?' : `P${finding.priority}`;
    }

    /** 优先级 CSS 类。 */
    function priorityClass(finding) {
      return finding?.priority === null || finding?.priority === undefined ? 'unknown' : `p${finding.priority}`;
    }

    /** 把文本里的行内代码/粗体渲染成节点。 */
    function inlineNodes(text, keyPrefix) {
      const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/gu);
      return parts
        .filter(part => part !== '')
        .map((part, index) => {
          const key = `${keyPrefix}-${index}`;
          if (part.startsWith('`') && part.endsWith('`') && part.length >= 3) {
            return jsx('code', { key, className: 'cr-inline-code', children: part.slice(1, -1) });
          }
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 5) {
            return jsx('strong', { key, children: part.slice(2, -2) });
          }
          return part;
        });
    }

    /** 迷你 Markdown：围栏代码 + 段落 + 行内代码/粗体。 */
    function MarkdownLite({ text }) {
      const source = String(text ?? '');
      const blocks = [];
      const fence = /```([A-Za-z0-9_-]*)\r?\n?([\s\S]*?)```/gu;
      let last = 0;
      let match;
      while ((match = fence.exec(source)) !== null) {
        if (match.index > last) blocks.push({ type: 'text', text: source.slice(last, match.index) });
        blocks.push({ type: 'code', lang: match[1], text: match[2] });
        last = match.index + match[0].length;
      }
      if (last < source.length) blocks.push({ type: 'text', text: source.slice(last) });

      const nodes = [];
      blocks.forEach((block, blockIndex) => {
        if (block.type === 'code') {
          nodes.push(jsx('pre', {
            key: `code-${blockIndex}`,
            className: 'cr-codeblock',
            children: jsx('code', { children: block.text }),
          }));
          return;
        }
        const paragraphs = block.text.split(/\n{2,}/u);
        paragraphs.forEach((paragraph, paragraphIndex) => {
          if (paragraph.trim() === '') return;
          nodes.push(jsx('p', {
            key: `p-${blockIndex}-${paragraphIndex}`,
            className: 'cr-paragraph',
            children: inlineNodes(paragraph, `${blockIndex}-${paragraphIndex}`),
          }));
        });
      });
      return jsxs('div', { className: 'cr-finding-body', children: nodes });
    }

    /** 解析 hunk，给 diff 行附带新旧行号。 */
    function annotatePatch(patch) {
      let oldLine = 0;
      let newLine = 0;
      const rows = [];
      for (const line of String(patch ?? '').split(/\r?\n/u)) {
        if (line.startsWith('@@')) {
          const header = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/u.exec(line);
          if (header !== null) {
            oldLine = Number(header[1]);
            newLine = Number(header[2]);
          }
          rows.push({ line, kind: 'hunk', oldNumber: '', newNumber: '' });
          continue;
        }
        if (line.startsWith('+')) {
          rows.push({ line, kind: 'add', oldNumber: '', newNumber: String(newLine) });
          newLine += 1;
          continue;
        }
        if (line.startsWith('-')) {
          rows.push({ line, kind: 'del', oldNumber: String(oldLine), newNumber: '' });
          oldLine += 1;
          continue;
        }
        if (line.startsWith('\\')) {
          rows.push({ line, kind: 'meta', oldNumber: '', newNumber: '' });
          continue;
        }
        rows.push({ line, kind: 'ctx', oldNumber: String(oldLine), newNumber: String(newLine) });
        oldLine += 1;
        newLine += 1;
      }
      return rows;
    }

    /** 复制文本；不可用时返回 false。 */
    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }

    /* ------------------------------------------------------------------ */
    /* icons                                                               */
    /* ------------------------------------------------------------------ */

    function IconReview({ size = 20 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('path', { d: 'M6 4.5v9.2A4.3 4.3 0 0 0 10.3 18h5.2', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
          jsx('circle', { cx: 6, cy: 4.2, r: 2, stroke: 'currentColor', strokeWidth: 1.7 }),
          jsx('circle', { cx: 17, cy: 18, r: 2, stroke: 'currentColor', strokeWidth: 1.7 }),
          jsx('path', { d: 'M15.6 4.4l3.4 3.4M19 4.4l-3.4 3.4', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', opacity: 0.55 }),
        ],
      });
    }

    function IconGithub({ size = 16 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('circle', { cx: 4, cy: 4, r: 2, stroke: 'currentColor', strokeWidth: 1.3 }),
          jsx('circle', { cx: 4, cy: 12, r: 2, stroke: 'currentColor', strokeWidth: 1.3 }),
          jsx('circle', { cx: 12, cy: 6, r: 2, stroke: 'currentColor', strokeWidth: 1.3 }),
          jsx('path', { d: 'M4 6v4M6 6.5c2.6 0 4 .8 4 3.2', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
        ],
      });
    }

    function IconRefresh({ size = 16 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('path', { d: 'M13 8a5 5 0 1 1-1.46-3.54', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
          jsx('path', { d: 'M13 2.6V5.4h-2.8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        ],
      });
    }

    function IconPlay({ size = 14 }) {
      return jsx('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: jsx('path', { d: 'M4.5 2.9v10.2L13 8 4.5 2.9z', fill: 'currentColor' }),
      });
    }

    function IconStop({ size = 14 }) {
      return jsx('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: jsx('rect', { x: 4, y: 4, width: 8, height: 8, rx: 1.4, fill: 'currentColor' }),
      });
    }

    function IconCopy({ size = 14 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('rect', { x: 5.2, y: 5.2, width: 7.3, height: 7.3, rx: 1.4, stroke: 'currentColor', strokeWidth: 1.3 }),
          jsx('path', { d: 'M3.5 10.2V4.7c0-.7.5-1.2 1.2-1.2h5.5', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
        ],
      });
    }

    function IconExternal({ size = 12 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('path', { d: 'M6.5 3.5H3.8c-.7 0-1.3.6-1.3 1.3v7.4c0 .7.6 1.3 1.3 1.3h7.4c.7 0 1.3-.6 1.3-1.3V9.5', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
          jsx('path', { d: 'M9.5 2.5h4v4M13.3 2.7L7.4 8.6', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        ],
      });
    }

    function IconFile({ size = 18 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('path', { d: 'M4 2.5h5l3 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }),
          jsx('path', { d: 'M9 2.7V5.5h2.8', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }),
        ],
      });
    }

    function IconAlert({ size = 14 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('path', { d: 'M8 2.2l5.9 10.6H2.1L8 2.2z', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }),
          jsx('path', { d: 'M8 6.2v3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
          jsx('circle', { cx: 8, cy: 11.2, r: 0.75, fill: 'currentColor' }),
        ],
      });
    }

    function IconBranch({ size = 13 }) {
      return jsxs('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: [
          jsx('circle', { cx: 4.2, cy: 4, r: 1.7, stroke: 'currentColor', strokeWidth: 1.2 }),
          jsx('circle', { cx: 4.2, cy: 12, r: 1.7, stroke: 'currentColor', strokeWidth: 1.2 }),
          jsx('circle', { cx: 11.8, cy: 6.2, r: 1.7, stroke: 'currentColor', strokeWidth: 1.2 }),
          jsx('path', { d: 'M4.2 5.7v4.6M5.9 6.4c2.3 0 4.2 1 4.2 3.4', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        ],
      });
    }

    function IconCheck({ size = 14 }) {
      return jsx('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        children: jsx('path', { d: 'M3.2 8.4l3.1 3.1 6.5-6.8', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      });
    }

    /* ------------------------------------------------------------------ */
    /* components                                                          */
    /* ------------------------------------------------------------------ */

    /** 侧栏图标：只画图标，点击/标签由 shell 的 panellist 拥有。 */
    function NavIcon({ size = 20, active }) {
      return jsx('span', {
        style: {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: size, height: size, color: active ? 'var(--dsw-alias-brand-primary)' : 'currentColor',
        },
        children: jsx(IconReview, { size }),
      });
    }

    /** 空状态。 */
    function EmptyState({ title, hint, icon, action }) {
      return jsxs('div', { className: 'cr-empty', children: [
        jsx('div', { className: 'cr-empty-icon', children: icon ?? jsx(IconFile, { size: 22 }) }),
        jsx('div', { className: 'cr-empty-title', children: title }),
        hint ? jsx('div', { className: 'cr-empty-hint', children: hint }) : null,
        action ?? null,
      ] });
    }

    /** 评审结果面板。 */
    function ReviewResult({ result, review, t, isZh, onCopy, copied, onRetry, onCopyLocation }) {
      const findings = Array.isArray(result?.findings) ? result.findings : [];
      const counts = result?.counts ?? {};
      const verdict = result?.overallCorrectness;
      const verdictClass = verdict === 'patch is correct' ? 'correct' : verdict === 'patch is incorrect' ? 'incorrect' : 'unknown';
      const verdictText = verdict === 'patch is correct'
        ? t('review.verdict.correct')
        : verdict === 'patch is incorrect'
          ? t('review.verdict.incorrect')
          : t('review.verdict.unknown');
      const [showRaw, setShowRaw] = React.useState(false);

      return jsxs('div', { className: 'cr-review-inner', children: [
        jsxs('div', { className: 'cr-result-head', children: [
          jsx('span', { className: `cr-verdict ${verdictClass}`, children: verdictText }),
          findings.length > 0
            ? jsx('span', { className: 'cr-badge', children: findings.length })
            : jsx('span', { className: 'cr-badge muted', children: '0' }),
          jsxs('div', { className: 'cr-prio-counts', children: ['P0', 'P1', 'P2', 'P3'].map(level => (
            jsxs('span', { key: level, className: 'cr-prio-count', children: [
              jsx('strong', { children: counts[level] ?? 0 }),
              level,
            ] })
          )) }),
        ] }),
        jsxs('div', { className: 'cr-summary', children: [
          jsx('h2', { children: t('review.summary') }),
          jsx('p', { children: result?.overallExplanation || (findings.length === 0 ? t('review.noFindings') : '—') }),
          jsxs('div', { className: 'cr-result-meta', children: [
            review?.meta?.model?.model ? jsx('span', { children: t('review.model', { model: review.meta.model.model }) }) : null,
            review?.elapsedMs ? jsx('span', { children: t('review.elapsed', { s: (review.elapsedMs / 1000).toFixed(1) }) }) : null,
            review?.meta?.stats ? jsx('span', { children: t('tabs.files', { n: review.meta.stats.files }) }) : null,
          ] }),
        ] }),
        jsxs('div', { className: 'cr-findings', children: [
          jsx('h2', { children: t('review.findings') }),
          findings.length === 0
            ? jsx('div', { className: 'cr-muted', children: result?.parsed ? t('review.noFindings') : t('review.parseFailed') })
            : findings.map((finding, index) => jsxs('article', {
              key: `${finding.file}-${finding.lineStart}-${index}`,
              className: `cr-finding ${priorityClass(finding)}`,
              children: [
                jsxs('div', { className: 'cr-finding-head', children: [
                  jsx('span', { className: `cr-prio ${priorityClass(finding)}`, children: priorityLabel(finding) }),
                  jsx('h3', { className: 'cr-finding-title', children: finding.title }),
                  finding.confidenceScore !== null
                    ? jsx('span', { className: 'cr-confidence', children: t('review.confidence', { n: Math.round(finding.confidenceScore * 100) }) })
                    : null,
                ] }),
                finding.file
                  ? jsx('button', {
                    type: 'button',
                    className: 'cr-location',
                    title: t('review.copyLocation'),
                    onClick: () => onCopyLocation(`${finding.file}:${finding.lineStart ?? 1}`),
                    children: `${finding.file}${finding.lineStart ? `:${finding.lineStart}${finding.lineEnd && finding.lineEnd !== finding.lineStart ? `-${finding.lineEnd}` : ''}` : ''}`,
                  })
                  : null,
                jsx(MarkdownLite, { text: finding.body }),
              ],
            })),
        ] }),
        jsxs('div', { className: 'cr-actions', children: [
          jsxs('button', { type: 'button', className: 'cr-btn', onClick: onCopy, children: [
            jsx(IconCopy, { size: 14 }),
            copied ? t('review.copied') : t('review.copy'),
          ] }),
          jsxs('button', { type: 'button', className: 'cr-btn', onClick: onRetry, children: [
            jsx(IconRefresh, { size: 14 }),
            t('review.retry'),
          ] }),
          result?.parsed === false
            ? jsx('button', {
              type: 'button',
              className: 'cr-link-btn',
              onClick: () => setShowRaw(value => !value),
              children: showRaw ? t('review.hideRaw') : t('review.raw'),
            })
            : null,
        ] }),
        result?.parsed === false ? jsx('div', { className: 'cr-warning', children: t('review.unparsed') }) : null,
        showRaw || result?.parsed === false
          ? jsx('pre', { className: 'cr-raw', children: result?.rawText || '' })
          : null,
      ] });
    }

    /** 审查进度。 */
    function ReviewProgress({ review, t, onCancel }) {
      const preview = String(review.text ?? '').slice(-8000);
      return jsxs('div', { className: 'cr-review-inner', children: [
        jsxs('div', { className: 'cr-progress', children: [
          jsxs('div', { className: 'cr-progress-head', children: [
            jsx('span', { className: 'cr-spinner' }),
            jsx('span', { children: review.message || t('review.running') }),
            jsxs('button', { type: 'button', className: 'cr-btn cr-btn-danger', style: { marginLeft: 'auto' }, onClick: onCancel, children: [
              jsx(IconStop, { size: 12 }),
              t('review.cancel'),
            ] }),
          ] }),
          review.thinkingChars > 0
            ? jsx('div', { className: 'cr-muted', children: t('review.thinking', { n: review.thinkingChars }) })
            : null,
          preview !== ''
            ? jsx('div', { className: 'cr-live', children: preview })
            : null,
        ] }),
      ] });
    }

    /** 主页面。 */
    function CodeReviewPage() {
      const t = React.useCallback((key, params) => translate(key, params), []);
      const [localeState, setLocaleState] = React.useState(() => ctx.locale.getSnapshot());
      React.useEffect(() => {
        const unsubscribe = ctx.locale.subscribe(() => setLocaleState(ctx.locale.getSnapshot()));
        return () => {
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      }, []);
      const isZh = String(localeState?.active ?? '').toLowerCase().startsWith('zh');

      const workspacesService = safeGet(ctx, 'workspaces');
      const sessionsService = safeGet(ctx, 'sessions');
      const workspacesState = useObservable(workspacesService?.list ?? EMPTY_WORKSPACES);
      const sessionsState = useObservable(sessionsService?.list ?? EMPTY_SESSIONS);
      const workspaceItems = Array.isArray(workspacesState?.items) ? workspacesState.items : [];

      const activeWorkspace = React.useMemo(() => {
        const current = Object.values(sessionsState?.byId ?? {}).find(item => (item?.retainedBy?.mainView ?? 0) > 0);
        const list = workspaceItems;
        const bySession = current === undefined
          ? undefined
          : list.find(item => Array.isArray(item?.sessionIds) && item.sessionIds.includes(current.id));
        return bySession ?? list[0] ?? null;
      }, [sessionsState, workspaceItems]);

      const [selectedPath, setSelectedPath] = React.useState('');
      const [context, setContext] = React.useState(null);
      const [contextLoading, setContextLoading] = React.useState(false);
      const [contextError, setContextError] = React.useState('');
      const [mode, setMode] = React.useState('uncommitted');
      const [base, setBase] = React.useState('');
      const [commit, setCommit] = React.useState('');
      const [instructions, setInstructions] = React.useState('');
      const [source, setSource] = React.useState({ kind: 'local' });
      const [diff, setDiff] = React.useState(null);
      const [diffLoading, setDiffLoading] = React.useState(false);
      const [diffError, setDiffError] = React.useState('');
      const [selectedFile, setSelectedFile] = React.useState(0);
      const [tab, setTab] = React.useState('diff');
      const [review, setReview] = React.useState({ status: 'idle', stage: '', message: '', text: '', thinkingChars: 0, meta: null, result: null, error: '', code: '', startedAt: 0, elapsedMs: 0 });
      const [health, setHealth] = React.useState(null);
      const [healthError, setHealthError] = React.useState('');
      const [healthLoading, setHealthLoading] = React.useState(true);
      const [healthRetry, setHealthRetry] = React.useState(0);
      const [gh, setGh] = React.useState({ loading: true, data: null, error: '' });
      const [ghRefresh, setGhRefresh] = React.useState(0);
      const [prScope, setPrScope] = React.useState('mine');
      const [copied, setCopied] = React.useState(false);
      const [refreshToken, setRefreshToken] = React.useState(0);
      const [avatarBroken, setAvatarBroken] = React.useState(false);

      const streamAbortRef = React.useRef(null);
      const reviewScrollRef = React.useRef(null);

      /* 默认工作区：优先当前主视图会话所在工作区。 */
      React.useEffect(() => {
        if (workspaceItems.length === 0) return;
        const exists = workspaceItems.some(item => samePath(item.path, selectedPath));
        if (exists) return;
        const next = activeWorkspace ?? workspaceItems[0];
        if (next?.path) setSelectedPath(next.path);
      }, [workspaceItems, activeWorkspace, selectedPath]);

      /* health */
      React.useEffect(() => {
        let alive = true;
        setHealthLoading(true);
        setHealthError('');
        request(apiPath('health'))
          .then(data => {
            if (!alive) return;
            setHealth(data);
            setHealthLoading(false);
          })
          .catch(error => {
            if (!alive) return;
            setHealth(null);
            setHealthError(error?.message ?? t('health.error'));
            setHealthLoading(false);
          });
        return () => { alive = false; };
      }, [healthRetry, t]);

      /* 仓库上下文 */
      React.useEffect(() => {
        if (selectedPath === '') return undefined;
        let alive = true;
        const controller = new AbortController();
        setContextLoading(true);
        setContextError('');
        request(`${apiPath('context')}?path=${encodeURIComponent(selectedPath)}`, { signal: controller.signal })
          .then(data => {
            if (!alive) return;
            setContext(data?.context ?? null);
            if (data?.context?.defaultBase) setBase(previous => previous || data.context.defaultBase);
            setContextLoading(false);
          })
          .catch(error => {
            if (!alive || error?.name === 'AbortError') return;
            setContext(null);
            setContextError(error?.message ?? t('common.error'));
            setContextLoading(false);
          });
        return () => { alive = false; controller.abort(); };
      }, [selectedPath, refreshToken, t]);

      /* GitHub 数据（repo PR 依赖仓库） */
      React.useEffect(() => {
        let alive = true;
        setGh(previous => ({ ...previous, loading: true, error: '' }));
        const repoFullName = context?.github ? `${context.github.owner}/${context.github.repo}` : '';
        request(`${apiPath('github')}?repo=${encodeURIComponent(repoFullName)}${refreshToken > 0 ? '&refresh=1' : ''}`)
          .then(data => {
            if (!alive) return;
            setGh({ loading: false, data, error: data?.ok === false ? data.error ?? t('github.unavailable') : '' });
          })
          .catch(error => {
            if (!alive) return;
            setGh({ loading: false, data: null, error: error?.message ?? t('github.unavailable') });
          });
        return () => { alive = false; };
      }, [context?.github?.owner, context?.github?.repo, ghRefresh, t]);

      const sourceKey = source.kind === 'pr' ? `pr:${source.repo}#${source.number}` : 'local';

      /* diff 自动加载 */
      React.useEffect(() => {
        if (source.kind === 'local') {
          if (selectedPath === '' || contextLoading) return undefined;
          if (context === null) {
            setDiff(null);
            setDiffError('');
            return undefined;
          }
          if (!context.isGit) {
            setDiff(null);
            setDiffError('');
            setDiffLoading(false);
            return undefined;
          }
          if (mode === 'base' && base.trim() === '') return undefined;
          if (mode === 'commit' && commit.trim().length < 4) {
            setDiff(null);
            setDiffLoading(false);
            return undefined;
          }
        }
        let alive = true;
        const controller = new AbortController();
        // 目标一变，旧审查就没有意义了：立刻中断它的流，避免旧结果写进新目标。
        streamAbortRef.current?.abort();
        streamAbortRef.current = null;
        const timer = window.setTimeout(() => {
          setDiffLoading(true);
          setDiffError('');
          const body = source.kind === 'pr'
            ? { source: { kind: 'pr', repo: source.repo, number: source.number } }
            : {
              path: selectedPath,
              mode,
              base: mode === 'base' ? base.trim() : undefined,
              commit: mode === 'commit' ? commit.trim() : undefined,
            };
          request(apiPath('diff'), { method: 'POST', body: JSON.stringify(body), signal: controller.signal })
            .then(data => {
              if (!alive) return;
              setDiff(data);
              setSelectedFile(0);
              setReview({ status: 'idle', stage: '', message: '', text: '', thinkingChars: 0, meta: null, result: null, error: '', code: '', startedAt: 0, elapsedMs: 0 });
              setDiffLoading(false);
            })
            .catch(error => {
              if (!alive || error?.name === 'AbortError') return;
              setDiff(null);
              setDiffError(error?.message ?? t('common.error'));
              setDiffLoading(false);
            });
        }, 220);
        return () => {
          alive = false;
          window.clearTimeout(timer);
          controller.abort();
        };
      }, [selectedPath, mode, base, commit, sourceKey, context, contextLoading, refreshToken, t]);

      /* 流式输出时自动滚到底部 */
      React.useEffect(() => {
        if (review.status !== 'running') return;
        const node = reviewScrollRef.current;
        if (node !== null) node.scrollTop = node.scrollHeight;
      }, [review.text, review.status]);

      React.useEffect(() => () => {
        streamAbortRef.current?.abort();
      }, []);

      const canReview = Boolean(
        diff !== null
        && Array.isArray(diff.files)
        && diff.files.length > 0
        && !diffLoading
        && (source.kind === 'pr' || context?.isGit === true)
        && !(mode === 'custom' && instructions.trim() === '')
        && health?.llm?.available !== false
        && review.status !== 'running',
      );

      const disabledReason = review.status === 'running'
        ? t('run.running')
        : diffLoading
          ? t('diff.loading')
          : diff === null || !Array.isArray(diff.files) || diff.files.length === 0
            ? t('run.disabledEmpty')
            : health?.llm?.available === false
              ? t('run.disabledModel')
              : mode === 'custom' && instructions.trim() === ''
                ? t('run.disabledInstructions')
                : '';

      const startReview = async () => {
        if (!canReview) return;
        const controller = new AbortController();
        streamAbortRef.current = controller;
        setReview({
          status: 'running', stage: 'collect', message: t('review.stage.collect'),
          text: '', thinkingChars: 0, meta: null, result: null, error: '', code: '',
          startedAt: Date.now(), elapsedMs: 0,
        });
        setTab('review');

        const body = source.kind === 'pr'
          ? {
            source: { kind: 'pr', repo: source.repo, number: source.number },
            instructions: instructions.trim() === '' ? undefined : instructions.trim(),
          }
          : {
            path: selectedPath,
            mode,
            base: mode === 'base' ? base.trim() : undefined,
            commit: mode === 'commit' ? commit.trim() : undefined,
            instructions: instructions.trim() === '' ? undefined : instructions.trim(),
          };

        try {
          const response = await fetch(apiPath('review'), {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          const contentType = response.headers.get('content-type') ?? '';
          if (!response.ok || contentType.includes('application/json')) {
            const payload = contentType.includes('json') ? await response.json().catch(() => null) : null;
            throw makeError(payload?.error ?? `HTTP ${response.status}`, payload?.code ?? 'review-failed', response.status);
          }
          if (response.body === null) throw makeError(t('review.error'), 'stream-unsupported', 0);

          const applyEvent = event => {
            if (event?.type === 'status') {
              setReview(previous => ({ ...previous, stage: event.stage, message: event.message ?? previous.message }));
            } else if (event?.type === 'meta') {
              setReview(previous => ({ ...previous, meta: event }));
            } else if (event?.type === 'delta' && typeof event.text === 'string') {
              setReview(previous => ({ ...previous, text: `${previous.text}${event.text}` }));
            } else if (event?.type === 'thinking' && typeof event.text === 'string') {
              setReview(previous => ({ ...previous, thinkingChars: previous.thinkingChars + event.text.length }));
            } else if (event?.type === 'result') {
              setReview(previous => ({ ...previous, status: 'done', stage: 'done', result: event.result, elapsedMs: event.elapsedMs ?? 0 }));
            } else if (event?.type === 'error') {
              setReview(previous => ({ ...previous, status: 'error', error: event.message ?? t('review.error'), code: event.code ?? 'review-failed' }));
            }
          };

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
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
                  applyEvent(JSON.parse(line));
                } catch {
                  // 忽略坏行。
                }
              }
              newline = buffer.indexOf('\n');
            }
          }
          const tail = buffer.trim();
          if (tail !== '') {
            try {
              applyEvent(JSON.parse(tail));
            } catch {
              // 忽略坏尾。
            }
          }
        } catch (error) {
          if (error?.name === 'AbortError') {
            setReview(previous => ({ ...previous, status: 'idle', stage: '', message: '', error: '', code: 'cancelled' }));
          } else {
            setReview(previous => ({ ...previous, status: 'error', error: error?.message ?? t('review.error'), code: error?.code ?? 'review-failed' }));
          }
        } finally {
          streamAbortRef.current = null;
        }
      };

      const cancelReview = () => {
        streamAbortRef.current?.abort();
      };

      const selectMode = next => {
        setSource({ kind: 'local' });
        setMode(next);
      };

      const selectWorkspace = path => {
        setSelectedPath(path);
        setSource({ kind: 'local' });
        setCommit('');
        setBase('');
        setDiff(null);
        setDiffError('');
        setReview({ status: 'idle', stage: '', message: '', text: '', thinkingChars: 0, meta: null, result: null, error: '', code: '', startedAt: 0, elapsedMs: 0 });
      };

      const selectPr = pr => {
        setSource({ kind: 'pr', repo: pr.repo, number: pr.number, title: pr.title, url: pr.url });
        setTab('diff');
      };

      const backToLocal = () => setSource({ kind: 'local' });

      const copyMarkdown = async () => {
        if (!review.result?.markdown) return;
        const ok = await copyText(review.result.markdown);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }
      };

      const copyLocation = async path => {
        await copyText(path);
      };

      const login = health?.githubUser || gh.data?.user?.login || gh.data?.login || 'UponNoise';
      const ghUser = gh.data?.user ?? null;
      const ghLink = ghUser?.htmlUrl || `https://github.com/${login}`;
      const avatarUrl = ghUser?.avatarUrl || `https://github.com/${login}.png?size=80`;
      const githubRepo = context?.github ? `${context.github.owner}/${context.github.repo}` : '';
      const githubRepoUrl = context?.github?.url ?? '';
      const prList = prScope === 'repo' && githubRepo !== '' ? gh.data?.repoPrs ?? [] : gh.data?.myPrs ?? [];
      const diffFiles = Array.isArray(diff?.files) ? diff.files : [];
      const fileIndex = Math.min(selectedFile, Math.max(0, diffFiles.length - 1));
      const currentFile = diffFiles[fileIndex] ?? null;
      const findings = Array.isArray(review.result?.findings) ? review.result.findings : [];
      const reviewCount = findings.length;
      const selectedPathTitle = workspaceItems.find(item => samePath(item.path, selectedPath))?.title || selectedPath;

      const modeCards = [
        { id: 'uncommitted', title: 'scope.uncommitted', desc: 'scope.uncommittedDesc' },
        { id: 'base', title: 'scope.base', desc: 'scope.baseDesc' },
        { id: 'commit', title: 'scope.commit', desc: 'scope.commitDesc' },
        { id: 'custom', title: 'scope.custom', desc: 'scope.customDesc' },
      ];

      /* 顶栏 */
      const header = jsxs('header', { className: 'cr-header', children: [
        jsxs('div', { className: 'cr-title', children: [
          jsx('span', { className: 'cr-logo', children: jsx(IconReview, { size: 21 }) }),
          jsxs('div', { style: { minWidth: 0 }, children: [
            jsx('h1', { children: t('page.title') }),
            jsx('p', { children: t('page.subtitle') }),
          ] }),
        ] }),
        jsxs('div', { className: 'cr-header-actions', children: [
          jsxs('a', {
            className: 'cr-gh-chip',
            href: ghLink,
            target: '_blank',
            rel: 'noreferrer noopener',
            title: t('header.github'),
            children: [
              avatarBroken
                ? jsx('span', { className: 'cr-avatar-fallback', children: login.slice(0, 1).toUpperCase() })
                : jsx('img', { src: avatarUrl, alt: '', loading: 'lazy', onError: () => setAvatarBroken(true) }),
              jsx('span', { className: 'cr-gh-login', children: `@${login}` }),
              jsx(IconExternal, { size: 11 }),
            ],
          }),
          jsx('button', {
            type: 'button',
            className: 'cr-icon-btn',
            title: t('header.refresh'),
            'aria-label': t('header.refresh'),
            onClick: () => {
              setHealthRetry(value => value + 1);
              setGhRefresh(value => value + 1);
              setRefreshToken(value => value + 1);
            },
            children: jsx(IconRefresh, { size: 16 }),
          }),
        ] }),
      ] });

      /* 左侧工作区与范围 */
      const workspaceCard = jsxs('div', { className: 'cr-section', children: [
        jsx('h2', { className: 'cr-section-title', children: t('workspace.label') }),
        jsx('div', { className: 'cr-card', children: [
          workspaceItems.length === 0
            ? jsxs('div', { className: 'cr-muted', children: [
              jsx('div', { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)', marginBottom: 4 }, children: t('workspace.none') }),
              t('workspace.noneHint'),
            ] })
            : jsx('select', {
              className: 'cr-select',
              value: selectedPath,
              'aria-label': t('workspace.label'),
              onChange: event => selectWorkspace(event.target.value),
              children: workspaceItems.map(item => jsx('option', { key: item.workspaceId, value: item.path, children: item.title || item.path })),
            }),
          contextError !== ''
            ? jsx('div', { className: 'cr-error', style: { marginTop: 8 }, children: contextError })
            : null,
          contextLoading
            ? jsx('div', { className: 'cr-muted', style: { marginTop: 8 }, children: t('workspace.loading') })
            : null,
          context !== null && context.isGit === false
            ? jsx('div', { className: 'cr-warning', style: { marginTop: 8 }, children: t('workspace.notGit') })
            : null,
          context !== null && context.isGit === true
            ? jsxs('div', { className: 'cr-repo', children: [
              jsxs('div', { className: 'cr-repo-row', children: [
                jsx('span', { className: 'cr-chip', children: jsx(IconBranch, { size: 12 }) }),
                githubRepo !== ''
                  ? jsx('a', { className: 'cr-repo-name', href: githubRepoUrl, target: '_blank', rel: 'noreferrer noopener', children: githubRepo })
                  : jsx('span', { className: 'cr-repo-name', children: context.name || selectedPathTitle }),
                context.dirty
                  ? jsx('span', { className: 'cr-chip dirty', children: t('workspace.dirty', { n: context.changedFiles }) })
                  : jsx('span', { className: 'cr-chip', children: t('workspace.clean') }),
              ] }),
              jsxs('div', { className: 'cr-repo-row', children: [
                jsx('span', { className: 'cr-chip branch', title: context.head, children: context.branch || 'HEAD' }),
                context.upstream ? jsx('span', { className: 'cr-chip', children: context.upstream }) : null,
                context.ahead > 0 ? jsx('span', { className: 'cr-chip', children: t('workspace.ahead', { n: context.ahead }) }) : null,
                context.behind > 0 ? jsx('span', { className: 'cr-chip', children: t('workspace.behind', { n: context.behind }) }) : null,
              ] }),
              githubRepo !== ''
                ? jsxs('a', { className: 'cr-link-btn', href: githubRepoUrl, target: '_blank', rel: 'noreferrer noopener', children: [t('workspace.openGithub'), jsx(IconExternal, { size: 11 })] })
                : null,
            ] })
            : null,
        ] }),
      ] });

      const scopeSection = jsxs('div', { className: 'cr-section', children: [
        jsx('h2', { className: 'cr-section-title', children: t('scope.label') }),
        source.kind === 'pr'
          ? jsxs('div', { className: 'cr-pr-target', children: [
            jsx('div', { className: 'cr-pr-target-title', children: source.title || `PR #${source.number}` }),
            jsx('div', { className: 'cr-pr-target-meta', children: `${source.repo}#${source.number}` }),
            jsxs('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }, children: [
              jsx('a', { href: source.url, target: '_blank', rel: 'noreferrer noopener', children: [t('header.github'), jsx(IconExternal, { size: 11 })] }),
              jsx('button', { type: 'button', className: 'cr-link-btn', onClick: backToLocal, children: t('scope.backToLocal') }),
            ] }),
          ] })
          : jsxs('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [
            context !== null && context.isGit === false
              ? jsx('div', { className: 'cr-muted', style: { fontSize: 11 }, children: t('scope.prDisabled') })
              : null,
            modeCards.map(card => jsxs('button', {
              key: card.id,
              type: 'button',
              className: 'cr-mode',
              role: 'radio',
              'aria-checked': mode === card.id ? 'true' : 'false',
              'data-active': mode === card.id ? 'true' : 'false',
              disabled: context !== null && context.isGit === false,
              onClick: () => selectMode(card.id),
              children: [
                jsxs('span', { className: 'cr-mode-title', children: [jsx('span', { className: 'cr-mode-radio' }), t(card.title)] }),
                jsx('span', { className: 'cr-mode-desc', children: t(card.desc) }),
              ],
            })),
            mode === 'base'
              ? jsx('label', { className: 'cr-label', children: [
                t('scope.baseLabel'),
                jsx('select', {
                  className: 'cr-select',
                  value: base,
                  onChange: event => setBase(event.target.value),
                  children: (context?.branches ?? []).map(branch => jsx('option', { key: `${branch.remote ? 'r' : 'l'}:${branch.name}`, value: branch.name, children: branch.remote ? branch.name : `${branch.name}（本地）` })),
                }),
              ] })
              : null,
            mode === 'commit'
              ? jsx('label', { className: 'cr-label', children: [
                t('scope.commitLabel'),
                jsx('input', {
                  className: 'cr-input',
                  value: commit,
                  placeholder: t('scope.commitPlaceholder'),
                  list: 'cr-recent-commits',
                  onChange: event => setCommit(event.target.value),
                }),
                jsx('datalist', {
                  id: 'cr-recent-commits',
                  children: (context?.recentCommits ?? []).map(item => jsx('option', { key: item.short, value: item.short, label: `${item.subject} · ${item.author}` })),
                }),
              ] })
              : null,
            mode === 'custom'
              ? jsx('label', { className: 'cr-label', children: [
                t('scope.customLabel'),
                jsx('textarea', {
                  className: 'cr-textarea',
                  value: instructions,
                  placeholder: t('scope.customPlaceholder'),
                  onChange: event => setInstructions(event.target.value),
                }),
              ] })
              : null,
          ] }),
      ] });

      const runSection = jsxs('div', { className: 'cr-section', children: [
        jsxs('div', { className: 'cr-run', children: [
          jsxs('div', { className: 'cr-model-row', children: [
            jsx('span', { children: t('run.model') }),
            jsx('span', { className: 'cr-model-chip', children: health?.llm?.defaultSelection?.model || '—' }),
          ] }),
          review.status === 'running'
            ? jsxs('button', { type: 'button', className: 'cr-btn cr-btn-danger', onClick: cancelReview, children: [
              jsx(IconStop, { size: 13 }),
              t('run.cancel'),
            ] })
            : jsxs('button', {
              type: 'button',
              className: 'cr-btn cr-btn-primary',
              disabled: !canReview,
              title: disabledReason || t('run.label'),
              onClick: startReview,
              children: [jsx(IconPlay, { size: 13 }), t('run.label')],
            }),
          jsx('div', { className: 'cr-run-hint', children: disabledReason || t('run.hint') }),
        ] }),
      ] });

      /* GitHub 区块 */
      const ghError = gh.error || (gh.data?.ok === false ? gh.data.error : '');
      const githubSection = jsxs('div', { className: 'cr-section', children: [
        jsxs('div', { className: 'cr-section-head', children: [
          jsxs('h2', { className: 'cr-section-title', style: { display: 'inline-flex', alignItems: 'center', gap: 5 }, children: [jsx(IconGithub, { size: 13 }), t('github.title')] }),
          jsx('button', {
            type: 'button',
            className: 'cr-icon-btn',
            title: t('github.refresh'),
            'aria-label': t('github.refresh'),
            onClick: () => setGhRefresh(value => value + 1),
            children: jsx(IconRefresh, { size: 13 }),
          }),
        ] }),
        jsx('div', { className: 'cr-seg', role: 'tablist', children: [
          jsx('button', { type: 'button', role: 'tab', 'aria-selected': prScope === 'mine' ? 'true' : 'false', 'data-active': prScope === 'mine' ? 'true' : 'false', onClick: () => setPrScope('mine'), children: t('github.mine') }),
          jsx('button', {
            type: 'button', role: 'tab', 'aria-selected': prScope === 'repo' && githubRepo !== '' ? 'true' : 'false',
            'data-active': prScope === 'repo' && githubRepo !== '' ? 'true' : 'false',
            disabled: githubRepo === '',
            onClick: () => setPrScope('repo'),
            children: t('github.repo'),
          }),
        ] }),
        gh.loading
          ? jsx('div', { className: 'cr-muted', children: t('github.loading') })
          : ghError !== ''
            ? jsxs('div', { className: 'cr-warning', children: [
              jsx(IconAlert, { size: 13 }),
              jsxs('div', { children: [
                jsx('div', { style: { fontWeight: 600 }, children: gh.data?.ok === false ? t('github.unavailable') : t('common.error') }),
                jsx('div', { children: gh.data?.ok === false ? t('github.unavailableHint') : ghError }),
              ] }),
            ] })
            : prList.length === 0
              ? jsxs('div', { className: 'cr-muted', children: [
                jsx('div', { children: t('github.empty') }),
                jsx('div', { style: { fontSize: 11 }, children: t('github.emptyHint') }),
              ] })
              : jsx('div', { className: 'cr-pr-list', children: prList.map(pr => jsxs('div', {
                key: `${pr.repo}#${pr.number}`,
                className: 'cr-pr-row',
                children: [
                  jsxs('button', {
                    type: 'button',
                    className: 'cr-pr',
                    'data-active': source.kind === 'pr' && source.repo === pr.repo && source.number === pr.number ? 'true' : 'false',
                    onClick: () => selectPr(pr),
                    children: [
                      jsx('span', { className: 'cr-pr-title', children: pr.title || `#${pr.number}` }),
                      jsx('span', { className: 'cr-pr-meta', children: `${pr.repo || githubRepo}#${pr.number} · ${relativeTime(pr.updatedAt, isZh)}` }),
                    ],
                  }),
                  jsx('a', {
                    className: 'cr-pr-open',
                    href: pr.url,
                    target: '_blank',
                    rel: 'noreferrer noopener',
                    title: t('header.github'),
                    children: jsx(IconExternal, { size: 12 }),
                  }),
                ],
              })) }),
        jsxs('a', {
          className: 'cr-link-btn',
          href: prScope === 'repo' && githubRepo !== '' ? `https://github.com/${githubRepo}/pulls` : 'https://github.com/pulls',
          target: '_blank',
          rel: 'noreferrer noopener',
          children: [t('github.openAll'), jsx(IconExternal, { size: 11 })],
        }),
      ] });

      const aside = jsxs('aside', { className: 'cr-aside', children: [workspaceCard, scopeSection, runSection, githubSection] });

      /* 主区目标标题 */
      const targetTitle = source.kind === 'pr'
        ? source.title || `PR #${source.number}`
        : diff?.title || t('workspace.localChanges');
      const targetSubtitle = source.kind === 'pr'
        ? `${source.repo}#${source.number}`
        : diff?.subtitle || (context?.isGit ? `${context.branch || 'HEAD'} · ${selectedPathTitle}` : selectedPathTitle);

      const toolbar = jsxs('div', { className: 'cr-toolbar', children: [
        jsxs('div', { className: 'cr-target', children: [
          jsx('div', { className: 'cr-target-title', title: targetTitle, children: targetTitle }),
          jsx('div', { className: 'cr-target-sub', title: targetSubtitle, children: targetSubtitle }),
        ] }),
        jsxs('div', { className: 'cr-toolbar-right', children: [
          diff?.stats
            ? jsxs('span', { className: 'cr-stats', children: [
              jsx('span', { children: t('tabs.files', { n: diff.stats.files }) }),
              jsx('span', { className: 'cr-stat-add', children: `+${diff.stats.additions}` }),
              jsx('span', { className: 'cr-stat-del', children: `-${diff.stats.deletions}` }),
            ] })
            : null,
          jsxs('div', { className: 'cr-tabs', role: 'tablist', children: [
            jsx('button', {
              type: 'button', role: 'tab', className: 'cr-tab',
              'aria-selected': tab === 'diff' ? 'true' : 'false',
              'data-active': tab === 'diff' ? 'true' : 'false',
              onClick: () => setTab('diff'),
              children: [t('tabs.diff'), diffFiles.length > 0 ? jsx('span', { className: 'cr-badge muted', children: diffFiles.length }) : null],
            }),
            jsx('button', {
              type: 'button', role: 'tab', className: 'cr-tab',
              'aria-selected': tab === 'review' ? 'true' : 'false',
              'data-active': tab === 'review' ? 'true' : 'false',
              onClick: () => setTab('review'),
              children: [t('tabs.review'), reviewCount > 0 ? jsx('span', { className: 'cr-badge', children: reviewCount }) : null],
            }),
          ] }),
        ] }),
      ] });

      /* 差异内容 */
      let diffContent;
      if (diffLoading) {
        diffContent = jsx('div', { className: 'cr-skeleton', children: [1, 2, 3, 4].map(index => jsx('div', { key: index, className: 'cr-skeleton-bar', style: { width: `${88 - index * 9}%` } })) });
      } else if (diffError !== '') {
        diffContent = jsx(EmptyState, {
          title: t('common.error'),
          hint: diffError,
          icon: jsx(IconAlert, { size: 22 }),
          action: jsx('button', { type: 'button', className: 'cr-btn', onClick: () => setRefreshToken(value => value + 1), children: t('common.retry') }),
        });
      } else if (diff === null || diffFiles.length === 0) {
        diffContent = jsx(EmptyState, {
          title: t('diff.empty'),
          hint: mode === 'commit' && commit.trim().length < 4 ? t('scope.commitPlaceholder') : t('diff.emptyHint'),
          icon: jsx(IconFile, { size: 22 }),
        });
      } else {
        const rows = currentFile === null ? [] : annotatePatch(currentFile.patch);
        diffContent = jsxs('div', { className: 'cr-diff-layout', children: [
          jsxs('div', { className: 'cr-filelist', children: [
            jsxs('div', { className: 'cr-filelist-head', children: [
              jsx('span', { children: t('tabs.files', { n: diffFiles.length }) }),
              jsx('span', { children: `${(diff.stats?.additions ?? 0) >= 0 ? '+' : ''}${diff.stats?.additions ?? 0} / -${diff.stats?.deletions ?? 0}` }),
            ] }),
            diffFiles.map((file, index) => {
              const parts = String(file.path).replaceAll('\\', '/').split('/');
              const name = parts.pop() ?? file.path;
              const directory = parts.join('/');
              return jsxs('button', {
                key: `${file.path}-${index}`,
                type: 'button',
                className: 'cr-file',
                'data-active': index === fileIndex ? 'true' : 'false',
                onClick: () => setSelectedFile(index),
                title: file.path,
                children: [
                  jsx('span', { className: `cr-file-status ${file.status}`, children: statusLetter(file.status) }),
                  jsxs('span', { className: 'cr-file-path', children: [
                    jsx('span', { className: 'cr-file-name', children: name }),
                    directory !== '' ? jsx('span', { className: 'cr-file-dir', children: directory }) : null,
                  ] }),
                  jsxs('span', { className: 'cr-file-nums', children: [
                    jsx('span', { className: 'a', children: `+${file.additions}` }),
                    ' ',
                    jsx('span', { className: 'd', children: `-${file.deletions}` }),
                  ] }),
                ],
              });
            }),
            Array.isArray(diff.untracked) && diff.untracked.length > 0
              ? jsxs('div', { className: 'cr-muted', style: { padding: '6px 4px', fontSize: 10.5 }, children: [
                `${t('diff.untracked')}: ${diff.untracked.length}`,
                diff.untracked.some(file => file.skipped) ? ` · ${t('diff.untrackedSkipped', { n: diff.untracked.filter(file => file.skipped).length })}` : '',
              ] })
              : null,
          ] }),
          jsxs('div', { className: 'cr-viewer', ref: tab === 'review' ? null : undefined, children: currentFile === null ? null : [
            jsxs('div', { className: 'cr-viewer-head', children: [
              jsx('span', { className: 'cr-viewer-path', title: currentFile.path, children: currentFile.oldPath && currentFile.oldPath !== currentFile.path ? `${currentFile.oldPath} → ${currentFile.path}` : currentFile.path }),
              jsxs('span', { style: { display: 'inline-flex', gap: 8, alignItems: 'center', flex: 'none' }, children: [
                jsx('span', { className: 'cr-prio-count', children: t(`status.${currentFile.status}`) }),
                jsx('span', { className: 'cr-file-nums', children: [
                  jsx('span', { className: 'a', children: `+${currentFile.additions}` }), ' ', jsx('span', { className: 'd', children: `-${currentFile.deletions}` }),
                ] }),
              ] }),
            ] }),
            currentFile.binary
              ? jsx('div', { className: 'cr-empty', children: jsx('div', { className: 'cr-empty-hint', children: t('diff.binary') }) })
              : jsxs('div', { className: 'cr-diff', children: [
                rows.map((row, index) => jsxs('div', {
                  key: index,
                  className: `cr-diff-line ${row.kind}`,
                  children: [
                    jsx('span', { className: 'cr-gutter', children: row.oldNumber }),
                    jsx('span', { className: 'cr-gutter', children: row.newNumber }),
                    jsx('span', { className: 'cr-diff-mark', children: row.kind === 'add' ? '+' : row.kind === 'del' ? '-' : '' }),
                    jsx('span', { className: 'cr-diff-text', children: row.line === '' ? '\u00a0' : row.line }),
                  ],
                })),
                currentFile.patchOmitted ? jsx('div', { className: 'cr-muted', style: { padding: '8px 14px' }, children: t('diff.patchOmitted') }) : null,
              ] }),
          ] }),
        ] });
      }

      /* 审查内容 */
      let reviewContent;
      if (review.status === 'running') {
        reviewContent = jsx('div', { className: 'cr-review', ref: reviewScrollRef, children: jsx(ReviewProgress, { review, t, onCancel: cancelReview }) });
      } else if (review.status === 'error') {
        reviewContent = jsx('div', { className: 'cr-review', children: jsxs('div', { className: 'cr-review-inner', children: [
          jsxs('div', { className: 'cr-error', children: [
            jsx(IconAlert, { size: 14 }),
            jsxs('div', { children: [
              jsx('div', { style: { fontWeight: 700 }, children: t('review.error') }),
              jsx('div', { children: review.error || review.code || t('common.unknown') }),
            ] }),
          ] }),
          jsxs('div', { className: 'cr-actions', children: [
            jsxs('button', { type: 'button', className: 'cr-btn cr-btn-primary', onClick: startReview, children: [jsx(IconPlay, { size: 13 }), t('review.retry')] }),
          ] }),
        ] }) });
      } else if (review.status === 'done' && review.result !== null) {
        reviewContent = jsx('div', { className: 'cr-review', children: jsx(ReviewResult, {
          result: review.result,
          review,
          t,
          isZh,
          copied,
          onCopy: copyMarkdown,
          onRetry: startReview,
          onCopyLocation: copyLocation,
        }) });
      } else {
        reviewContent = jsx('div', { className: 'cr-review', children: jsx(EmptyState, {
          title: t('review.idle'),
          hint: t('review.idleHint'),
          icon: jsx(IconReview, { size: 22 }),
          action: jsxs('button', { type: 'button', className: 'cr-btn cr-btn-primary', disabled: !canReview, onClick: startReview, children: [jsx(IconPlay, { size: 13 }), t('run.label')] }),
        }) });
      }

      let stageContent;
      if (healthError !== '') {
        stageContent = jsx(EmptyState, {
          title: t('health.error'),
          hint: `${healthError} · ${t('health.errorHint')}`,
          icon: jsx(IconAlert, { size: 22 }),
          action: jsx('button', { type: 'button', className: 'cr-btn', onClick: () => setHealthRetry(value => value + 1), children: t('common.retry') }),
        });
      } else if (tab === 'review') {
        stageContent = reviewContent;
      } else if (context !== null && context.isGit === false && source.kind === 'local') {
        stageContent = jsx(EmptyState, {
          title: t('workspace.notGit'),
          hint: t('workspace.notGitHint'),
          icon: jsx(IconFile, { size: 22 }),
        });
      } else if (workspaceItems.length === 0 && source.kind === 'local') {
        stageContent = jsx(EmptyState, {
          title: t('empty.workspace'),
          hint: t('empty.workspaceHint'),
          icon: jsx(IconFile, { size: 22 }),
        });
      } else {
        stageContent = diffContent;
      }

      /* 底部提示 */
      const notes = Array.isArray(diff?.notes) ? diff.notes : [];
      const footerNotes = notes.length > 0
        ? jsxs('div', { className: 'cr-muted', style: { padding: '6px 16px', borderTop: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: 11 }, children: [
          `${t('diff.note')}: ${notes.join(' ')}`,
        ] })
        : null;

      return jsxs('div', { className: 'cr-page', children: [
        header,
        jsxs('div', { className: 'cr-body', children: [aside, jsxs('section', { className: 'cr-main', children: [toolbar, jsx('div', { className: 'cr-stage', children: stageContent }), footerNotes] })] }),
      ] });
    }

    /* ------------------------------------------------------------------ */
    /* apply                                                               */
    /* ------------------------------------------------------------------ */

    let ctx = null;
    let translate = (key, params) => {
      const dict = zh;
      let text = dict[key] ?? key;
      if (params !== undefined && params !== null) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    };

    function apply(clientCtx) {
      ctx = clientCtx;
      clientCtx.effect(() => clientCtx.locale.register(NS, { zh, en }), 'code-review: dictionaries');
      const bound = clientCtx.locale.bind(NS);
      translate = (key, params) => bound(key, params);

      clientCtx.effect(() => {
        if (typeof document === 'undefined') return () => {};
        const style = document.createElement('style');
        style.dataset.plugin = 'dsh-code-review';
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => {
          style.remove();
        };
      }, 'code-review: styles');

      clientCtx.slots.inject('sidebar.panellist', () => clientCtx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 35,
        label: () => translate('nav.label'),
      }, NavIcon));

      clientCtx.slots.inject('main', () => clientCtx.slots.register({
        name: 'main',
        key: PANEL_ID,
      }, CodeReviewPage));
    }

    exports.name = 'code-review';
    exports.inject = ['slots', 'locale', 'workspaces', 'sessions'];
    exports.apply = apply;
    // 仅供离线冒烟脚本使用；宿主 loader 只读 name / inject / apply。
    exports.__internals = {
      CodeReviewPage,
      ReviewResult,
      ReviewProgress,
      MarkdownLite,
      NavIcon,
      annotatePatch,
      apiPath,
    };
    return module.exports;
  },
});
