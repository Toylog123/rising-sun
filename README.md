# Rising Sun 课题组 · 组会资料库

Rising Sun 课题组组会资料归档，包含论文报告、PPT 演示等。研究方向：AI for EDA / ECO。

- **网站**：https://Toylog123.github.io/rising-sun/
- **协议**：MIT License

## 🔬 研究方向
- AI for EDA（人工智能驱动的电子设计自动化）
- ECO（工程变更命令）智能化求解
- 机器学习 / 组合优化 / 芯片后端物理设计

## 📝 资料提交规范
1. 每期组会创建以日期命名的文件夹，格式 `YYYY.M.D`
2. 论文原文以 `论文名称.pdf` 命名，汇报 PPT 以 `论文名称_PPT.pptx` 命名
3. 新增组会后可更新 `website/src/data/meetings.json`

## 🔄 任务看板同步（GitHub 后端）

任务看板使用 **GitHub 仓库本身作为在线数据库**——所有数据保存在仓库的 `website/src/data/tasks.json`，通过 GitHub Contents API 读写。

- 无 PAT → 只能浏览（每次打开页面自动拉取最新）
- 有 PAT → 可修改任务，写操作自动推送到 GitHub；其他人刷新即可看到

### 添加新协作者

1. 仓库所有者：`Settings` → `Collaborators` → `Add people` → 输入组员 GitHub 用户名 → 角色 `Write`
2. 组员收到邀请邮件，确认后即可访问

### 生成 Personal Access Token（每个用户一次）

1. 打开 https://github.com/settings/personal-access-tokens/new
2. **Token name**：例如 `rising-sun-tasks`
3. **Expiration**：建议 90 天或更长，到期前邮件提醒
4. **Repository access** → 选择 `Only select repositories` → 选 `Toylog123/rising-sun`
5. **Permissions** → `Repository permissions` → `Contents` → `Read and write`
6. 点击 `Generate token` → **复制保存**（只显示一次！）
7. 在网页右上角 ⚙️ 设置 → 粘贴 PAT → 保存（自动拉取最新）
8. 建议：勾选 `Test connection` 验证是否可访问

**隐私**：PAT 仅保存在你本地浏览器的 localStorage，**不上传任何服务器**；清除浏览器数据会丢失。每次换电脑/浏览器都要重新输入。

### 同步策略

- **实时同步**：每次新增任务/更新进展/归档/删除 → 自动 push（600ms debounce 合并连击）
- **冲突处理**：GitHub 返回 409 时自动拉取最新 → 合并 → 重试（最多 3 次）
- **离线降级**：断网时仍能在本地操作，状态栏显示"同步失败"，恢复后点 ⚙️ 或导航栏绿点手动重试

## 🚀 本地开发
```bash
cd website
npm install
npm run dev
npm run build
```

构建完成后需将 `website/dist/` 的产物复制到仓库根目录（`index.html` 和 `assets/`），然后提交推送即可触发 GitHub Pages 重新部署。
