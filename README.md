# dsh-code-review

DeepSeek Harness 的「代码审查」插件：左侧栏一个入口，主面板复刻 Codex 的代码审查体验。

> 社区插件，与 DeepSeek、OpenAI、GitHub 均无隶属或背书关系。

## 安装

```sh
dsh plugin --profile web add github:UponNoise/dsh-code-review
```

装完刷新页面（或重启 DSH），左侧栏会出现「代码审查」。需要 DSH 0.2.x（在 `0.2.1-rc.5` 上验证）、Git；GitHub PR 功能额外需要本机已登录的 `gh` CLI。

也可以从 Release 的预构建 tarball 安装：

```sh
dsh plugin --profile web add https://github.com/UponNoise/dsh-code-review/releases/latest/download/dsh-code-review.tgz
```


## 功能

- **侧栏入口**：`sidebar.panellist` 注册 `code-review`，点击打开 `main` 里的 `code-review` 主面板。
- **GitHub**：读取本机 `gh` CLI 的登录态，展示账号（默认 `UponNoise`）与头像；左栏列出「我的开放 PR」和当前仓库的开放 PR，点击即可载入 PR diff。
- **审查范围**（对标 `codex review`）：
  - 未提交的更改（暂存 + 未暂存 + 未跟踪）
  - 对比基线分支（PR style）
  - 指定提交
  - 自定义审查指令
- **差异浏览**：逐文件 unified diff、增删统计、文件树、未跟踪文件（合成 diff）。
- **模型审查**：Host 侧调用 DSH 已配置的 `llm` 服务（默认跟随 profile 的 `agent-default-model`），流式返回；输出结构化 findings，按 **P0/P1/P2/P3** 优先级展示，可复制为 Markdown。
- **本地优先**：diff 在本机收集；只有「开始审查」时才把 diff 发给当前配置的模型。不会向 GitHub 写入任何评论。

## 同类项目

| 项目 | 侧重 |
| --- | --- |
| [@michengai/dsh-code-review](https://github.com/MichengAI/dsh-code-review) | `/review` + 独立子 Agent，使用 Codex rubric，在对话里返回报告；无侧栏面板 / PR 浏览 |
| [@feng0531/dsh-code-review](https://github.com/f-e-n-g-0531/dsh-code-review) | 工具式 Git/SVN 审查，预览-确认-执行，非商业源码许可 |
| [dsh-git-review](https://github.com/HaoyueQin/dsh-git-review) | 会话 Review Tab + Git 工作台（diff、提交图、暂存/提交），不做模型审查 |
| [moazzamak/dsh-code-review](https://github.com/moazzamak/dsh-code-review) | `/review` 快捷键打开 DSH 内置 Changes 页 + 一个 Skill |
| [@dsh-plugin/dsh-code-review](https://github.com/dsh-plugins/dsh-code-review) | 逐轮修改摘要、Review Tab、受保护的 undo；GPL-3.0 |

本插件的差异点：把「左侧栏面板 + GitHub PR 浏览 + 本地四种审查范围 + Codex rubric 直连当前 profile 模型」放在一起，全程只读，不创建子 Agent、不修改代码、不写 GitHub。

## 架构

```
index.js            Host 插件入口：在 webServer 上挂 5 条 exact 路由
lib/git.js          git 调用：仓库上下文、分支、提交、diff 收集
lib/diff.js         unified diff 解析、未跟踪文件合成 diff
lib/github.js       gh CLI 探测、GitHub 用户 / PR 列表 / PR diff
lib/prompt.js       Codex 风格审查提示词
lib/review.js       llm.stream 流式调用 + 结果解析
lib/routes.js       HTTP 路由、JSON/NDJSON、同源检查
client.js           浏览器半：侧栏图标 + 审查页（React，无外部依赖）
locale/*.json       插件管理器元数据
icon.svg            插件图标
```

### HTTP 路由（均为同源、仅本机）

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/dsh-code-review/api/health` | 服务、gh、默认模型探测 |
| GET | `/dsh-code-review/api/context?path=` | 仓库信息（分支、状态、远程） |
| POST | `/dsh-code-review/api/diff` | 本地/PR diff |
| GET | `/dsh-code-review/api/github?repo=` | GitHub 账号与 PR 列表 |
| POST | `/dsh-code-review/api/review` | NDJSON 流式审查 |

### 配置

在 `cordis.patch.yml` 的行 config 里可覆盖：

```yaml
- insert:
    - id: code-review
      name: '@uponnoise/dsh-code-review'
      config:
        githubUser: UponNoise
        provider: deepseek-official   # 可选
        model: deepseek-flash         # 可选
```

## 卸载

从插件管理器移除本 bundle，或删除 profile 补丁里的 `code-review` 行。插件不写用户文件：审查结果只留在当前页面内存，不落盘，也不改仓库。

## 许可

- 本插件源代码：MIT，见 [LICENSE](LICENSE)。
- `lib/rubric.md`：逐字取自 [OpenAI Codex](https://github.com/openai/codex) 的 [`codex-rs/prompts/templates/review/rubric.md`](https://github.com/openai/codex/blob/rust-v0.149.0/codex-rs/prompts/templates/review/rubric.md)（Apache-2.0），见 [LICENSE-APACHE-2.0](LICENSE-APACHE-2.0) 与 [NOTICE](NOTICE)。
- 审查结果的 `Review comment:` / `Full review comments:` 渲染格式对标 [`codex-rs/protocol/src/review_format.rs`](https://github.com/openai/codex/blob/rust-v0.149.0/codex-rs/protocol/src/review_format.rs)；只参考格式，未复制其代码。

## 致谢 / Attribution

- 审查 rubric 逐字取自 [openai/codex](https://github.com/openai/codex)（tag `rust-v0.149.0`，Apache-2.0）。本插件只把「reviewer 自己跑 git」改写成「Host 预取 diff」。
- UI 的四种审查范围与 P0–P3 语义对标 Codex `/review` 选择器；图标为本插件原创。
