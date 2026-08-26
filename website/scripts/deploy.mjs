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
html = html.replace(/\/rising-sun\/assets\/index-[\w-]+\.js/, `/rising-sun/assets/${js}`);
html = html.replace(/\/rising-sun\/assets\/index-[\w-]+\.css/, `/rising-sun/assets/${css}`);
fs.writeFileSync(rootIndexPath, html);

// 4. 同步 assets/：删除旧产物（含 .map），复制新 js/css（不部署 sourcemap）
const rootAssets = path.join(rootDir, "assets");
for (const f of fs.readdirSync(rootAssets)) {
  if (/^index-[\w-]+\.(js|css|js\.map)$/.test(f)) fs.rmSync(path.join(rootAssets, f));
}
fs.copyFileSync(path.join(distAssets, js), path.join(rootAssets, js));
fs.copyFileSync(path.join(distAssets, css), path.join(rootAssets, css));

// 5. logo.svg（public/logo.svg → dist/logo.svg → 根目录 favicon 用）
const distLogo = path.join(websiteDir, "dist", "logo.svg");
if (fs.existsSync(distLogo)) {
  fs.copyFileSync(distLogo, path.join(rootDir, "logo.svg"));
}

console.log(`✔ 部署完成：${js} + ${css}`);
console.log("  下一步：git add -A && git commit && git push（Pages 约 1-2 分钟生效）");
