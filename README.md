# Rising Sun 课题组网站

国防科技大学集成电路科学与工程课题组 Rising Sun 的官方网站，同时承担组会资料管理 + 课题组成果展示 + 任务协作的功能。

- **线上地址**：https://Toylog123.github.io/rising-sun/
- **协议**：MIT License
- **作者**：佟亚龙（网站负责人，联系方式见页脚）
- **指导老师**：刘畅（国防科技大学集成电路科学与工程副教授）

---

## 📌 课题组介绍

Rising Sun 是一个 2025 年新成立的课题组，专注**芯片设计自动化（EDA）**方向：

- 🧠 **AI for EDA** — 大模型 / 强化学习 / 图神经网络应用于 EDA 工具链
- ⚙️ **ECO**（工程变更命令）— 物理设计后期的智能变更求解
- 🔧 **物理设计 / 布局布线 / 时序分析** — 传统 EDA 算法与机器学习结合

---

## 🎯 网站功能

| 页面 | 路径 | 功能 |
|------|------|------|
| **首页** | `/` | 课题组介绍 + 3 个研究方向卡片 + 成员进度概览 + 最新进展 |
| **任务列表** | `/tasks` | 按成员分组的所有任务（含新增进展、归档、永久删除） |
| **成员** | `/members` | 课题组所有成员（老师 + 学生），可编辑（简介/职称/研究方向/学科/学位层次），学生卡带**毕业要求达成条** |
| **成果** | `/achievements` | 论文 / 专利 / 比赛获奖 三类，分类显示；录入时**从成果目录选刊会**、按人汇总 + **毕业要求达成看板** |
| **组会** | `/meetings` | 每周组会纪要（日期 / 主讲人 / 议题 / 纪要）+ **汇报材料 PDF 上传** + 按主讲人筛选 |
| **学位要求** | `/degree-requirements` | **学位成果选刊手册**，三个专业各一份（0812/0835 计算机科学与技术·软件工程、1401 集成电路科学与工程、电子信息大类）：毕业要求速览 + 目录分级对应 + 期刊会议清单 + 本组投稿梯队 + 口径提示。**刊会全量目录 660 条**（CCF 推荐目录 644 条、电子学会分级目录 368 条、中科院分区、一类目录 13 本），支持按研究方向 / 档位 / 类型 / 关键词筛选，全页可检索 |
| **新建任务** | `/new` | 表单：指导老师 + 协同成员（多选） + 标题 + 创建时间 + 状态 |
| **归档** | `/archive` | 已完成任务 / 已删除任务（Tab 区分："全部 / 已完成 / 已删除"） |

**Navbar 6 个主链接**（水平居中布局）：首页 / 任务 / 成员 / 成果 / 组会 / 学位要求

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 路由 | React Router 7 |
| 状态管理 | Zustand 5（含 `persist` 中间件，自动存 localStorage） |
| 样式 | Tailwind CSS 3 |
| 图标 | lucide-react |
| 后端 | **GitHub Contents API**（无服务器 — 仓库即数据库） |
| 部署 | GitHub Pages |
| 域名 | `Toylog123.github.io/rising-sun/` |

---

## 🗂️ 文件结构

```
rising-sun/
├── index.html                      # GitHub Pages 入口（含 404 SPA 重定向脚本）
├── assets/                          # 部署的 build 产物（commit 上去的，由 deploy 脚本同步）
│   ├── index-XXXXX.js
│   └── index-XXXXX.css
├── logo.svg                         # favicon / 站点图标
├── uploads/                        # 组会汇报材料（PDF，网站前端直接上传到这里）
│   └── meetings/
│       └── README.md               # 目录说明 + 命名规则
├── website/                         # 源码
│   ├── scripts/
│   │   ├── deploy.mjs              # 一键部署脚本（npm run deploy）
│   │   ├── publish.mjs             # 绕开 git push 的发布通道（npm run publish）
│   │   ├── alias-hook.mjs          # Node 跑 .ts 测试时的 @/ 路径别名
│   │   └── alias-loader.mjs
│   ├── src/
│   │   ├── components/             # React 组件
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx           # 页面骨架（Navbar + Outlet + Footer）
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskEditor.tsx
│   │   │   ├── StudentEditor.tsx
│   │   │   ├── MeetingEditor.tsx
│   │   │   ├── PdfPreview.tsx        # PDF 预览弹窗（Pages 内嵌 + raw 下载）
│   │   │   ├── AchievementEditor.tsx  # 成果录入（归属人 + 目录选刊会 + 折算项）
│   │   │   ├── VenuePicker.tsx       # 刊会搜索选择器（输入才展开，避免全量下拉）
│   │   │   ├── DegreeBoard.tsx       # 毕业要求达成看板（进度条 + 详情面板）
│   │   │   ├── StatusBadge.tsx      # 任务状态徽标
│   │   │   ├── Confirm.tsx          # 自定义确认弹窗
│   │   │   ├── Toast.tsx            # 右上角通知
│   │   │   ├── Combobox.tsx         # 多选下拉
│   │   │   ├── PushHistory.tsx      # 推送历史
│   │   │   └── TokenSetup.tsx
│   │   ├── pages/                   # 路由页面
│   │   │   ├── Home.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Achievements.tsx
│   │   │   ├── Meetings.tsx
│   │   │   ├── DegreeRequirements.tsx # 选刊手册（三专业切换 + 全文检索）
│   │   │   ├── AddTask.tsx
│   │   │   └── Archive.tsx
│   │   ├── store/                   # Zustand stores
│   │   │   ├── tasks.ts             # 任务 + 成员 + dirty 机制
│   │   │   ├── meetings.ts          # 组会（自动同步）
│   │   │   ├── achievements.ts     # 成果（自动同步）
│   │   │   └── ui.ts                # Confirm + Toast 全局状态
│   │   ├── hooks/
│   │   │   ├── useScrollReveal.ts  # 滚动渐入动画
│   │   │   └── useConfirmClose.ts  # 编辑弹窗「未保存就关闭」二次确认
│   │   ├── lib/
│   │   │   ├── github.ts            # GitHub Contents API 封装（含二进制上传）
│   │   │   ├── uploads.ts           # 附件上传 / Pages & raw 链接生成
│   │   │   ├── auth.ts              # 全站共享 PAT（单一数据源）
│   │   │   ├── merge.ts             # 组会记录合并规则（多人协作防覆盖）
│   │   │   ├── merge.test.mjs       # 合并规则自检
│   │   │   ├── uploads.test.mjs     # 上传/链接生成自检
│   │   │   ├── degreeAudit.ts        # 成果 → 毕业要求判定（等级推导 + 折算）
│   │   │   ├── degreeAudit.test.mjs  # 判定规则自检
│   │   │   ├── download.ts          # 导出 Markdown / JSON 工具
│   │   │   └── students.ts          # calcGrade 工具函数
│   │   ├── data/                    # 种子数据（build 进 bundle）
│   │   │   ├── tasks.json
│   │   │   ├── meetings.json
│   │   │   ├── achievements.json
│   │   │   ├── degreeRequirements.ts # 三专业毕业要求原文条款
│   │   │   ├── degreeAwards.ts # 三专业毕业要求规则（通道/折算/等级判定）
│   │   │   ├── ccfCatalog.ts # CCF 高质量科技期刊 T1/T2/T3
│   │   │   ├── ccfFull.ts # CCF 推荐目录 10 个领域共 644 条
│   │   │   ├── cseeFull.ts # 电子学会期刊分级目录 368 条（T1 81 / T2 126 / T3 161）
│   │   │   ├── venueCatalog.ts # 手工核实的重点刊会 127 条（含分区/影响因子/易错提示）
│   │   │   ├── venueFull.ts # 三套口径合并逻辑与分发表
│   │   │   ├── venueIndex.ts # 全量目录入口（660 条）
│   │   │   └── venueGrades.ts # 三专业档位判定（含会议与正式期刊兜底）
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/                      # 静态资源（照片等）
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

---

## 🔄 同步机制（核心设计）

**没有后端服务器**——用 **GitHub 仓库本身当数据库**。

### 三个数据文件

| 文件 | 内容 | 自动同步？ |
|------|------|----------|
| `website/src/data/tasks.json` | 任务 + 成员（课组信息） | ✅ 手动提交 |
| `website/src/data/meetings.json` | 组会纪要 + 汇报材料元数据 | ✅ 实时自动推送 |
| `website/src/data/achievements.json` | 论文/专利/比赛 | ✅ 实时自动推送 |

### 实时同步 vs 手动提交

| 模块 | 模式 | 原因 |
|------|------|------|
| **任务** | 手动提交（手动同步模式） | 组会时多人编辑，**等用户点"提交 N 项"才推送**——避免冲突 |
| **组会 / 成果** | 实时同步（输入后 600ms 自动推送） | 改动频率低，无冲突 |

### 同步按钮（Navbar 右上）

- 🟢 绿点 = 已同步
- 🟡 黄点 = 同步中
- 🔴 红点 = 同步失败（含限速倒计时）
- ⚪ 灰点 = 未配置 PAT

---

## 🚀 快速开始

### 本地开发

```bash
cd website
npm install
npm run dev
# 浏览器打开 http://localhost:5173

npm test            # 组会合并规则 + 附件上传的自检（merge.ts / uploads.ts）
```

### 部署流程

一条命令完成「构建 + 同步产物 + 更新 index.html 的资产 hash」：

```bash
cd website
npm run deploy        # = npm run build + scripts/deploy.mjs 同步产物到根目录
git add -A && git commit && git push
# GitHub Pages 自动部署（约 1-2 分钟）
```

> 脚本只替换 `index.html` 里的资产 hash（保留手动注入的 SPA 重定向脚本），且不会把 sourcemap 部署上去。

**git push 推不上去时的备用通道**

有些网络环境里 git 传输通道连不上 github.com（`fatal: unable to access ... Connection was reset`），
但 REST API 是通的。这种情况下可以用 Contents API 直接把产物写回仓库：

```bash
cd website
npm run publish -- --dry-run    # 先看看会发布哪些文件
npm run publish                 # 真发布（PAT 来自 GITHUB_PAT / .publish-pat / 交互输入）
npm run publish -- --prune      # 顺便删掉远端已废弃的旧产物
```

- PAT 需要 `Contents: Read and write` 权限（和上面「生成 PAT」一节一样）
- `.publish-pat` 文件已被 `.gitignore` 忽略，不会误提交
- 发布顺序是「先 assets/ 后 index.html」，避免出现新 HTML 指向还没上传的 JS 的白屏窗口
- 每个文件都会先比对 git blob sha，没变化就跳过，不会产生无意义的 commit

### 添加新协作者

1. 仓库所有者：`Settings` → `Collaborators` → `Add people` → 输入组员 GitHub 用户名 → 角色 `Write`
2. 组员收到邀请邮件，确认后即可访问

### 生成 Personal Access Token（每个用户一次）

1. 打开 https://github.com/settings/personal-access-tokens/new
2. **Token name**：例如 `rising-sun-tasks`
3. **Expiration**：90 天或更长，到期前邮件提醒
4. **Repository access** → `Only select repositories` → 选 `Toylog123/rising-sun`
5. **Permissions** → `Repository permissions` → `Contents` → `Read and write`
6. 点击 `Generate token` → **复制保存**（只显示一次！）
7. 在网页右上角 ⚙️ 设置 → 粘贴 PAT → 保存
8. 建议：勾选 `Test connection` 验证是否可访问

**隐私**：PAT 仅保存在你本地浏览器的 localStorage，**不上传任何服务器**。清除浏览器数据会丢失。

---

## 🎨 设计语言

- **主色**：橙红 `#c96442`（CTA / 重点）
- **次色**：暖白 `#faf9f5`（背景）+ 浅米 `#f0ece4`（次背景）
- **字体**：Noto Sans SC（无衬线）+ Noto Serif SC（衬线，用于标题/数字）
- **圆角**：统一 `rounded-xl` / `rounded-2xl`
- **阴影**：`shadow-sm` 轻阴影 + `shadow-md` 卡片悬停
- **图标风格**：线性（lucide-react），统一 `size={15-20}`

---

## 📋 数据结构（关键 Schema）

### `Task`（任务）

```ts
{
  id: string;                  // 唯一标识
  advisor?: string;            // 指导老师（默认 = 全局 advisor）
  assignees: string[];         // 协同成员（学生名 / "多人任务"）
  title: string;
  createdAt: string;           // "YYYY-MM-DD"
  updates: { date, status, note? }[];
  archived?: boolean;
  removedAt?: string;          // 手动删除时间（区分"已完成归档"和"手动删除"）
}
```

### `Student`（成员 / 老师）

```ts
{
  name: string;                 // 唯一主键
  enrolledAt?: string;         // "YYYY-MM"
  status?: StudentStatus;       // 学生才有
  role?: "teacher" | "student";// 老师 role="teacher"
  title?: string;               // 老师：副教授 / 教授 / 讲师
  note?: string;                // 备注
  bio?: string;                 // 简介（学生页显示）
  researchAreas?: string[];
  email?: string;
  homepage?: string;
  github?: string;
  program?: "集成电路科学与工程" | "计算机科学与技术" | "电子信息"; // 决定按哪套毕业要求判定
  degree?: "硕士" | "博士";                                      // 决定走硕士还是博士口径
}
```

### `Meeting`（组会）

```ts
{
  id, date: "YYYY-MM-DD", speaker, topic, notes?,
  attachments?: {                  // 汇报材料（PPT 导出的 PDF）
    name: string;                  // 原始文件名（展示用）
    path: string;                  // 仓库路径，如 "uploads/meetings/2026-11-07_a1b2c3_汇报.pdf"
    size: number;                  // 字节数
    sha?: string;                  // blob sha（删除文件时用）
    uploadedAt: string;            // ISO 时间戳
  }[];
  updatedAt?: string;              // ISO 时间戳，冲突合并时判断谁更新
}
```

---

## 📎 组会汇报材料（PDF 上传）

每次组会可以直接把 PPT 导出的 PDF 传上去，组会页按主讲人筛选，一眼看清谁汇报过什么。

**怎么用**

1. 组会页点「新增组会」（或点已有记录旁的铅笔图标编辑）
2. 「汇报材料（PPT 导出的 PDF，可选）」区块 → 「选择 PDF 文件」（可多选）
3. 点「保存」——文件先上传到仓库，再连同记录一起推送
4. 上传成功后卡片上出现附件胶囊，点开即可在网页里预览 PDF

**命名规范：`姓名_汇报内容.pdf`**

上传的文件名由网站按「主讲人 + 议题」自动生成，不用自己改：

| 汇报人 | 议题 | 生成的文件名 |
|---|---|---|
| 周雨时 | AI4EDA 六篇论文综述：数据集构建方法 | `周雨时_AI4EDA六篇论文综述：数据集构建方法.pdf` |
| 谢俊杰 | SEU 故障分析与加固优化：DMBF 与 ZACHO | `谢俊杰_SEU故障分析与加固优化：DMBF与ZACHO.pdf` |

规则细节（`website/src/lib/uploads.ts` 的 `buildAttachmentName`）：

- 姓名和议题之间的空格会被去掉，避免下载下来的文件名到处是空格
- 议题太长（超过 28 字）时优先在「：、，」这类分隔符处断开，断不开才硬截
- 截断后如果结尾挂在「与 / 和 / 的」这类连接词上，会顺手去掉
- 仓库里的实际路径前面还带日期和随机后缀：
  `uploads/meetings/2026-11-06_g64sqa_佟亚龙_RSECO：基于重综合的掩膜前时序ECO框架.pdf`
  —— 前缀保证唯一不覆盖，后半段就是给人看的规范名

**存储与访问**

| 环节 | 走哪条路 | 原因 |
|------|----------|------|
| 存文件 | `uploads/meetings/`（仓库根，Contents API PUT = 一次 commit） | 文件名带日期 + 随机后缀，不会同名互相覆盖 |
| 元数据 | `website/src/data/meetings.json` 的 `attachments` 字段 | 随组会记录一起推送 |
| 在线预览 | `https://Toylog123.github.io/rising-sun/uploads/...` | Pages 直链返回 `application/pdf`，能被 iframe 内嵌渲染 |
| 下载 | `https://raw.githubusercontent.com/...` | raw 直链始终最新，不受 Pages 构建缓存影响 |

> **为什么不能直接用 raw 链接预览**：raw.githubusercontent.com 对 PDF 返回
> `application/octet-stream` 且带 `X-Frame-Options: deny`，浏览器只会下载不会内嵌。
> GitHub Pages 直链才是 `application/pdf`，所以预览走 Pages、下载走 raw。

> **写文件用哪条 API**：优先走 Contents API 的 `PUT /contents/{path}`。GitHub
> 实际会**自动创建缺失的中间目录**（官方文档没写死，但 gh CLI / Octokit /
> go-github / PyGithub 全都直接 PUT 嵌套路径、不预建目录），所以不存在
> 「目录不存在」这种 404。两个例外会走兜底通道 **Git Data API**（blob →
> 自底向上建树 → commit → update ref）：仓库是空的（409
> "Git Repository is empty"）、或权限/分支不对（404，classic PAT 缺
> `repo` scope 时就是这个码）。

**限制与注意**

- 只接受 PDF，单个文件 ≤ 20 MB（`MAX_ATTACHMENT_BYTES`）
- 20 MB 是我们主动设的安全上限，不是 GitHub 的硬限制。GitHub 对写操作的请求体
  实际天花板约 50 MB（base64 会把体积再放大 1/3），实测 30–35 MB 的文件能传、
  40 MB 以上开始不稳定。传超大文件会被 GitHub 用 **422** 拒绝（不是 413），
  原文是 `Sorry, the file is too large to be processed...`，界面会翻译成
  「请压缩 PDF 后重试」
- 需要先配置 PAT（右上角 ⚙ 设置），否则无法上传
- 删除组会记录或移除附件时，会顺带删掉仓库里的 PDF 文件
- `uploads/` 随 GitHub Pages 一起发布，**等同公开可访问**，请勿放敏感材料
- 刚上传完可能预览不到：Pages 重新构建要 1-2 分钟，预览弹窗里有「重新检查」按钮
- 批量上传/删除时相邻请求之间会自动间隔 1 秒（GitHub 官方的写操作节流建议）

**多人协作**

组会 JSON 是多人共用的，拉取时不是简单覆盖，而是按 `updatedAt` 合并
（见 `website/src/lib/merge.ts`）：别人新增的记录不会被你冲掉，你本机刚传好
附件还没推送成功的改动也不会丢。合并规则有自检脚本：

```bash
cd website && npm test
```

### `Achievement`（成果）

```ts
// 公共字段
{ category: "论文" | "专利" | "比赛", year, authors, owner?, graduate?, note?, link? }
//   owner    归属成员（学生的成果必须归属到人才能统计毕业要求）
//   graduate 是否计入毕业要求统计（默认 true）

// 论文：venueKey 指向成果目录条目，系统据此判定等级
{ category: "论文", title, venue, venueKey?, venueKind?: "期刊" | "会议",
  authorRole?: "一作" | "共同一作" | "导师一作本人二作" | "通讯" | "其它",
  coAuthor?, bestPaper?, largeConference?,   // 三个折算勾选
  level?, jcr?, cas?, correspondingAuthors?, venueName? }

// 专利：{ category: "专利", name, patentNo?, status? }
// 比赛：{ category: "比赛", competition, award, advisors? }
```

---

## 🎓 成果 → 毕业要求匹配

录入成果时直接**从官方目录选刊会**，系统据此判定等级，并自动核对每位学生的毕业要求是否达成。老师打开「成果」页就能看到谁能毕业。

**三个人工设置决定判定口径**

| 位置 | 字段 | 作用 |
|------|------|------|
| 成员页 → 学生编辑 | `program` 学科 | 决定套用哪套目录（集成电路 / 计算机 / 电子信息） |
| 成员页 → 学生编辑 | `degree` 学位层次 | 决定走硕士还是博士口径（博士多一条基本要求「≥2 篇」） |
| 成果编辑 → 成果归属人 | `owner` | 成果算在谁头上；不填不会计入任何人的毕业统计 |

**等级怎么来的**

1. 优先看是否命中**一类目录**（Nature 系 / Science / Cell 等 13 本）——命中即按「一类目录」计，不再降级
2. 否则按学科规则从目录条目属性推导：CCF 等级、中科院分区（含 1 区 Top）、CCF 高质量科技期刊 T1/T2、国防科技大学学报
3. 集成电路另有 A-3（中国电子学会一类）、A-4（IEEE NSREC）两档
4. 选不到目录条目时可手填全称 + 手动指定等级，判定时按手填等级算

**折算规则（全自动）**

| 规则 | 系数 |
|------|------|
| CCF A/B 会议**最佳论文** | × 1.5 篇 |
| CCF A/B 会议**当年录用 ≥ 500 篇** | × 0.7 篇 |
| **共同一作** | 原则上只认第一篇满额，其余折半 |
| **共同作者**（沟通确认仅限一人使用） | 勾选后按折算计入，同一条款只认一次 |
| **导师一作本人二作** | 三个专业的硕士基本要求都认；其他条款需一作 |

**位次决定是否计入**

「一作 / 共同一作 / 导师一作本人二作」才计入毕业统计；「通讯」和「其它」只作为成果展示，不计入。

**看板在哪看**

- **成员页**：每位学生卡片上的达成条（基本要求 ✅/⏳、公开评审 ✅/⏳）
- **成果页**：顶部「按成员汇总」→ 点某人 → 展开完整面板（逐条要求、逐篇等级判定与原因）
- **成果编辑**：选完目录条目后立刻提示这篇会判成哪一档

**人工兜底的条款**

专著、重大项目应用、鉴定或应用证明这几类**系统不自动判定**（学院口径弹性大，需要导师认定），看板上会标「需人工确认」。

**目录数据来源**

- CCF 推荐国际会议与期刊目录：官网 10 个领域共 644 条（`data/ccfCatalog.ts`）
- CCF 高质量科技期刊分级目录：2025 版官方 PDF，T1 19 本 / T2 22 本 / T3 27 本
- 一类目录 13 本：学院原文附件，ISSN 已逐条核对
- 中科院分区：业内通行的近似值（`data/degreeAwards.ts` 的 `CAS_BY_ABBR`），**以当年官方分区表为准**
- 中国电子学会分级目录 T1/T2：官方名单未公开可抓取版本，目前未收录

> ⚠️ 判定结果是**辅助参考**，最终以学院研究生教务的正式认定为准。

---

## 🛠️ 故障排查

| 问题 | 解决 |
|------|------|
| 看到旧的导航 / 旧 UI | 硬刷新 `Ctrl + Shift + R`（绕过缓存） |
| 同步一直 404 | 检查 PAT 是否过期，重新生成 |
| 同步限速 403 | 配置 PAT 后拉取/推送均走认证配额（5000 次/小时）；未配 PAT 时仅 60 次/小时/IP，多人同一网络易触发，等 1-2 分钟或尽早配置 PAT |
| 数据不对（老的） | 右上角 🔄 清缓存 + 重新拉取 |
| 老师显示成学生 | 检查 tasks.json 里 member.role 字段（远端已包含） |
| 看到乱码 | 检查浏览器编码 = UTF-8 |
| 上传附件报「未配置 PAT」 | 右上角 ⚙ 设置里填 PAT（只需填一次，三个模块共用） |
| 上传报 404 | **不是目录不存在**（Contents API 会自动建中间目录）。多半是 PAT 权限不对：classic PAT 需要仓库 Contents 读写（repo scope），且分支存在。站点会自动改走 Git Data API 重试 |
| 上传报 409 | 仓库是空的（"Git Repository is empty"），站点会自动改走 Git Data API 建目录重试 |
| 上传报「文件太大」 | GitHub 请求体上限约 50 MB（base64 再涨 1/3），我们限制 20 MB；请压缩 PDF 后重试 |
| 上传报 422 | 同上（GitHub 用 422 而非 413 拒绝超大请求体） |
| 附件预览显示「Pages 还没发布出来」 | 等待 1-2 分钟，点「重新检查」；或直接点「下载」 |
| 多人同时编辑导致记录丢失 | 已按 `updatedAt` 合并（`lib/merge.ts`），若仍异常请先「刷新」再改 |
| 学生看不到毕业进度条 | 到成员页编辑该学生，填上「学科」和「学位层次」 |
| 成果没算进毕业要求 | 检查成果的「成果归属人」是否选了该学生，以及「计入本人毕业要求统计」是否被取消 |
| 等级判得不对 | 成果编辑里改为手动指定等级（手填全称 + 下拉覆盖）；或检查是否选错了目录条目 |

---

## 🗓️ Roadmap

- [ ] 任务评论 / 讨论区
- [ ] 任务标签（按学期 / 课程）
- [ ] 实时多人编辑（WebSocket）
- [ ] 通知中心（待办 / 截止日期）
- [ ] 移动端 PWA 优化
- [ ] 数据导入 / 导出

---

## 📜 License

MIT © 2026 Rising Sun 课题组
