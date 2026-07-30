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
| **成员** | `/members` | 课题组所有成员（老师 + 学生），可编辑（简介/职称/研究方向） |
| **成果** | `/achievements` | 论文 / 专利 / 比赛获奖 三类，分类显示 |
| **组会** | `/meetings` | 每周组会纪要（日期 / 主讲人 / 议题 / 纪要 / 决议） |
| **新建任务** | `/new` | 表单：指导老师 + 协同成员（多选） + 标题 + 创建时间 + 状态 |
| **归档** | `/archive` | 已完成任务 / 已删除任务（Tab 区分："全部 / 已完成 / 已删除"） |

**Navbar 5 个主链接**（水平居中布局）：首页 / 任务 / 成员 / 成果 / 组会

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
├── assets/                          # 部署的 build 产物（commit 上去的）
│   ├── index-XXXXX.js
│   ├── index-XXXXX.css
│   └── *.map
├── website/                         # 源码
│   ├── src/
│   │   ├── components/             # React 组件
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskEditor.tsx
│   │   │   ├── StudentEditor.tsx
│   │   │   ├── MeetingEditor.tsx
│   │   │   ├── AchievementEditor.tsx
│   │   │   ├── Confirm.tsx          # 自定义确认弹窗
│   │   │   ├── Toast.tsx            # 右上角通知
│   │   │   ├── Combobox.tsx         # 多选下拉
│   │   │   ├── PushHistory.tsx      # 推送历史
│   │   │   ├── ClearCacheButton.tsx
│   │   │   └── TokenSetup.tsx
│   │   ├── pages/                   # 路由页面
│   │   │   ├── Home.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Achievements.tsx
│   │   │   ├── Meetings.tsx
│   │   │   ├── AddTask.tsx
│   │   │   └── Archive.tsx
│   │   ├── store/                   # Zustand stores
│   │   │   ├── tasks.ts             # 任务 + 成员 + dirty 机制
│   │   │   ├── meetings.ts          # 组会（自动同步）
│   │   │   ├── achievements.ts     # 成果（自动同步）
│   │   │   └── ui.ts                # Confirm + Toast 全局状态
│   │   ├── lib/
│   │   │   ├── github.ts            # GitHub Contents API 封装
│   │   │   └── students.ts          # calcGrade 工具函数
│   │   ├── data/                    # 种子数据（build 进 bundle）
│   │   │   ├── tasks.json
│   │   │   ├── meetings.json
│   │   │   └── achievements.json
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
| `website/src/data/meetings.json` | 组会纪要 | ✅ 实时自动推送 |
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
```

### 部署流程

1. 修改源码 → `cd website && npm run build`
2. 复制 build 产物到根目录：
   ```bash
   cp dist/assets/index-*.js ../assets/
   cp dist/assets/index-*.css ../assets/
   ```
3. 更新 `index.html` 里的资产 hash
4. `git add -A && git commit && git push`
5. GitHub Pages 自动部署（约 1-2 分钟）

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
  advisor?: string;
}
```

### `Meeting`（组会）

```ts
{ id, date: "YYYY-MM-DD", speaker, topic, notes?, decisions? }
```

### `Achievement`（成果）

```ts
// 论文
{ category: "论文", title, venue, jcr?, cas?, correspondingAuthors? }
// 专利
{ category: "专利", name, patentNo?, status? }
// 比赛
{ category: "比赛", competition, award, advisors? }
```

---

## 🛠️ 故障排查

| 问题 | 解决 |
|------|------|
| 看到旧的导航 / 旧 UI | 硬刷新 `Ctrl + Shift + R`（绕过缓存） |
| 同步一直 404 | 检查 PAT 是否过期，重新生成 |
| 同步限速 403 | 等 1-2 分钟，GitHub 公共 API 60 次/小时 |
| 数据不对（老的） | 右上角 🔄 清缓存 + 重新拉取 |
| 老师显示成学生 | 检查 tasks.json 里 member.role 字段（远端已包含） |
| 看到乱码 | 检查浏览器编码 = UTF-8 |

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
