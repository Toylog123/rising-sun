/**
 * 一键部署：构建 + 同步产物到仓库根目录（GitHub Pages 部署目录）
 *
 * 替代手动流程：npm run build → cp dist/assets/* ../assets/ → 手改 index.html 的 hash
 * 用法：cd website && npm run deploy
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url)); // website/scripts
const websiteDir = path.dirname(scriptsDir); // website/
const rootDir = path.resolve(websiteDir, ".."); // 仓库根

// 1. 构建（tsc 类型检查 + vite build）
console.log("▶ 构建中（tsc -b && vite build）…");
const result = spawnSync("npm", ["run", "build"], {
  cwd: websiteDir,
  stdio: "inherit",
  // Windows 下 npm 是 .cmd 脚本，spawnSync 必须经由 shell 启动（否则 EINVAL）
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  console.error("✗ 构建失败，已中止部署");
  process.exit(result.status ?? 1);
}

// 2. 定位新产物
const distAssets = path.join(websiteDir, "dist", "assets");
const files = fs.readdirSync(distAssets);
const js = files.find((f) => /^index-[\w-]+\.js$/.test(f));
const css = files.find((f) => /^index-[\w-]+\.css$/.test(f));
if (!js || !css) {
  console.error("✗ dist/assets 下未找到 index-*.js / index-*.css");
  process.exit(1);
}

// 3. 更新根 index.html 的资产引用（只换 hash，保留手动注入的 SPA 重定向脚本）
const rootIndexPath = path.join(rootDir, "index.html");
let html = fs.readFileSync(rootIndexPath, "utf8");

// 记住「当前线上 HTML 引用的那一对产物」。Pages 对 index.html 只缓存约 10 分钟，
// 期间用户的浏览器还拿着旧 HTML 去请求旧产物 —— 这一对绝对不能被清掉，
// 否则旧 HTML 拿到 404 → 白屏。
//
// 注意：本地 index.html 可能已经比线上更新（还没 push），所以要同时看
// 「本地这份」、「最近一次提交的那份」和「远端 main 的那份」——
// 最后一份才是用户此刻真正在用的（HEAD 可能还没推上去）。
const liveRefs = new Set(
  [...html.matchAll(/\/rising-sun\/assets\/index-[\w-]+\.(?:js|css)/g)].map((m) =>
    path.basename(m[0])
  )
);
for (const rev of ["HEAD", "origin/main"]) {
  try {
    const committed = spawnSync("git", ["show", `${rev}:index.html`], {
      cwd: rootDir,
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (committed.status !== 0 || !committed.stdout) continue;
    for (const m of committed.stdout.matchAll(
      /\/rising-sun\/assets\/index-[\w-]+\.(?:js|css)/g
    )) {
      liveRefs.add(path.basename(m[0]));
    }
  } catch {
    // 拿不到这个版本就跳过，不影响部署
  }
}

html = html.replace(/\/rising-sun\/assets\/index-[\w-]+\.js/, `/rising-sun/assets/${js}`);
html = html.replace(/\/rising-sun\/assets\/index-[\w-]+\.css/, `/rising-sun/assets/${css}`);
if (!html.includes(`/rising-sun/assets/${js}`) || !html.includes(`/rising-sun/assets/${css}`)) {
  console.error("✗ index.html 中未找到旧的资产引用，请检查该文件是否被改动过");
  process.exit(1);
}
fs.writeFileSync(rootIndexPath, html);

// 4. 同步 assets/：保留最近几份旧产物
//
// GitHub Pages 对 index.html 只缓存约 10 分钟，期间浏览器仍会用「旧 HTML」去请求旧产物。
// 如果部署时把旧产物删掉，旧 HTML 拿到的就是 404 → JS 加载失败 → 整页白屏。
// 所以这里保留最近 KEEP_REVISIONS - 1 份旧产物，让「旧 HTML + 旧包」这个组合始终可用，
// 缓存过期后浏览器自然切到新版本。失败模式从「白屏」降级为「短暂显示旧版本」。
const KEEP_REVISIONS = 3;

const rootAssets = path.join(rootDir, "assets");
const ASSET_RE = /^index-[\w-]+\.(js|css)$/;
const MAP_RE = /^index-[\w-]+\.js\.map$/;

// sourcemap 永不部署
for (const f of fs.readdirSync(rootAssets)) {
  if (MAP_RE.test(f)) fs.rmSync(path.join(rootAssets, f));
}

// 按修改时间倒序排出旧产物（新的在前）
const oldAssets = fs
  .readdirSync(rootAssets)
  .filter((f) => ASSET_RE.test(f) && f !== js && f !== css)
  .map((f) => ({ f, t: fs.statSync(path.join(rootAssets, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);

fs.copyFileSync(path.join(distAssets, js), path.join(rootAssets, js));
fs.copyFileSync(path.join(distAssets, css), path.join(rootAssets, css));

// 只清理超出保留窗口的旧产物，但线上 HTML 正在引用的那一对永远保留
const expired = oldAssets.slice(KEEP_REVISIONS - 1);
for (const { f } of expired) {
  if (liveRefs.has(f)) {
    console.log(`  保留线上在用的产物 assets/${f}（旧 HTML 缓存窗口）`);
    continue;
  }
  fs.rmSync(path.join(rootAssets, f));
  console.log(`  清理过期产物 assets/${f}`);
}
const kept = oldAssets.length - expired.length;
if (oldAssets.length > 0) {
  console.log(`  保留旧产物 ${kept} 份（覆盖浏览器 HTML 缓存窗口）`);
}

// 5. logo.svg（public/logo.svg → dist/logo.svg → 根目录 favicon 用）
const distLogo = path.join(websiteDir, "dist", "logo.svg");
if (fs.existsSync(distLogo)) {
  fs.copyFileSync(distLogo, path.join(rootDir, "logo.svg"));
}

console.log(`✔ 部署完成：${js} + ${css}`);
console.log("  下一步：git add -A && git commit && git push（Pages 约 1-2 分钟生效）");
