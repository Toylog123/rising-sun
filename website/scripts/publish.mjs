/**
 * 通过 GitHub Contents API 发布前端产物（不依赖 git push）
 *
 * 为什么需要这条通道：部分网络环境下 git 传输通道（smart HTTP/SSH）连不上
 * github.com，但 REST API 是通的。只要有一个 PAT 就能把构建产物写回仓库，
 * GitHub Pages 照常发布。
 *
 * 用法：
 *   cd website
 *   npm run publish            # 发布 index.html + assets/*
 *   npm run publish -- --dry-run
 *   npm run publish -- --prune  # 顺便删掉远端已废弃的旧产物
 *
 * PAT 来源（按优先级）：
 *   1. 环境变量 GITHUB_PAT / GITHUB_TOKEN
 *   2. 仓库根目录的 .publish-pat 文件
 *   3. 交互式输入
 *
 * PAT 需要勾选 repo（私有库）或 public_repo（公开库）权限。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const OWNER = "Toylog123";
const REPO = "rising-sun";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

const scriptsDir = path.dirname(fileURLToPath(import.meta.url)); // website/scripts
const rootDir = path.resolve(scriptsDir, "..", ".."); // 仓库根

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const PRUNE = args.includes("--prune");

/* ---------- 工具函数 ---------- */

/** Git blob 的 sha1：sha1("blob <长度>\0" + 内容)，用来比对本地文件和远端是否一致 */
function gitBlobSha(buf) {
  const header = Buffer.from(`blob ${buf.length}\0`, "utf8");
  return crypto.createHash("sha1").update(header).update(buf).digest("hex");
}

function encodeRepoPath(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}

async function apiRequest(pathname, { method = "GET", body, token, accept } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Accept: accept || "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json };
}

/* ---------- 收集要发布的文件 ---------- */

/**
 * index.html 一定放在最后：它引用 assets/ 里的新文件。
 * 先推 assets 再推 HTML，就不会出现「新 HTML 指向还没上传的 JS」的白屏窗口。
 */
function collectFiles() {
  const assetsDir = path.join(rootDir, "assets");
  const files = [];

  if (fs.existsSync(assetsDir)) {
    for (const name of fs.readdirSync(assetsDir).sort()) {
      // 入口产物 + 共享 chunk（catalog-*.js 等）都要发，只发 index-* 会 404
      if (!/^[\w-]+-[\w-]+\.(js|css)$/.test(name)) continue;
      files.push(`assets/${name}`);
    }
  }
  files.push("index.html");
  return files;
}

/* ---------- 取 PAT ---------- */

function tokenFromEnv() {
  return (process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || "").trim();
}

function tokenFromFile() {
  const p = path.join(rootDir, ".publish-pat");
  if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  return "";
}

async function promptToken() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // 尽量不把 PAT 回显到屏幕上
  const stdoutWrite = rl.output.write.bind(rl.output);
  rl.output.write = (chunk) => stdoutWrite(chunk.replace(/[^/]/g, "*"));
  try {
    const answer = await rl.question("GitHub PAT（不会保存到仓库）: ");
    return String(answer).trim();
  } finally {
    rl.output.write = stdoutWrite;
    rl.close();
  }
}

/* ---------- 主流程 ---------- */

async function main() {
  const files = collectFiles();
  if (files.length === 0) {
    console.error("✗ 没有任何可发布的文件（assets/ 是空的？）");
    process.exit(1);
  }

  console.log(`▶ 待发布 ${files.length} 个文件${DRY_RUN ? "（dry-run，不实际写入）" : ""}`);
  for (const f of files) console.log(`  · ${f}`);

  if (DRY_RUN) {
    console.log("\n✔ dry-run 结束，未做任何写入");
    return;
  }

  let token = tokenFromEnv() || tokenFromFile();
  if (!token) token = await promptToken();
  if (!token) {
    console.error("✗ 没有 PAT，无法发布");
    process.exit(1);
  }

  // 先确认 PAT 有效
  const who = await apiRequest("", { token });
  if (who.res.status === 401) {
    console.error("✗ PAT 无效或已过期");
    process.exit(1);
  }
  if (who.json?.login) console.log(`  以 ${who.json.login} 的身份发布`);

  let uploaded = 0;
  let skipped = 0;
  const remoteAssets = new Set();

  for (const rel of files) {
    const localPath = path.join(rootDir, rel);
    if (!fs.existsSync(localPath)) {
      console.log(`  跳过 ${rel}（本地不存在）`);
      continue;
    }
    const buf = fs.readFileSync(localPath);
    const localSha = gitBlobSha(buf);

    // 用 object 媒体类型取 blob sha：官方文档说大于 1 MB 的文件只有
    // raw / object 媒体类型可用，而 object 仍然带 sha 字段
    const cur = await apiRequest(`/${encodeRepoPath(rel)}?ref=${BRANCH}`, {
      token,
      accept: "application/vnd.github.object+json",
    });
    if (cur.res.status === 200 && cur.json?.sha === localSha) {
      console.log(`  未变化 ${rel}`);
      skipped++;
      continue;
    }

    const payload = {
      message: `build: 发布 ${path.basename(rel)}`,
      content: buf.toString("base64"),
      branch: BRANCH,
      ...(cur.res.status === 200 && cur.json?.sha ? { sha: cur.json.sha } : {}),
    };
    const put = await apiRequest(`/${encodeRepoPath(rel)}`, { method: "PUT", body: payload, token });
    if (!put.res.ok) {
      const msg = put.json?.message || `HTTP ${put.res.status}`;
      console.error(`✗ ${rel} 发布失败：${msg}`);
      process.exit(1);
    }
    console.log(`  ✔ ${rel}`);
    uploaded++;
    if (rel.startsWith("assets/")) remoteAssets.add(path.basename(rel));
  }

  // 可选：删掉远端已废弃的旧产物
  if (PRUNE) {
    const list = await apiRequest(`/assets?ref=${BRANCH}`, { token });
    if (list.res.status === 200 && Array.isArray(list.json)) {
      for (const entry of list.json) {
        if (!/^index-[\w-]+\.(js|css)$/.test(entry.name)) continue;
        if (remoteAssets.has(entry.name)) continue;
        const del = await apiRequest(`/assets/${encodeURIComponent(entry.name)}?ref=${BRANCH}`, {
          method: "DELETE",
          body: { message: `chore: 清理旧产物 ${entry.name}`, sha: entry.sha, branch: BRANCH },
          token,
        });
        if (del.res.ok) console.log(`  ✔ 已删除旧产物 assets/${entry.name}`);
        else console.log(`  ! 删除 assets/${entry.name} 失败：${del.json?.message || del.res.status}`);
      }
    }
  }

  console.log(`\n✔ 发布完成：新上传 ${uploaded} 个，未变化 ${skipped} 个`);
  console.log("  GitHub Pages 约 1-2 分钟后生效：https://toylog123.github.io/rising-sun/");
}

main().catch((err) => {
  console.error("✗ 发布失败：", err?.message || err);
  process.exit(1);
});
