/**
 * 组会附件（PDF）上传与访问
 *
 * 存储：GitHub 仓库根 `uploads/meetings/`（Contents API 写入，等价于一次 commit）
 * 预览：GitHub Pages 直链 → Content-Type: application/pdf，可被 iframe 内嵌
 * 下载：raw 直链 → 绕过 Pages 缓存，上传后立即可下载
 *
 * 为什么不用 raw 预览：raw.githubusercontent 返回 `application/octet-stream`
 * 且带 `X-Frame-Options: deny`，浏览器只会下载不会内嵌渲染。
 * Pages 则是 `application/pdf`，正好能直接塞进 <iframe>。
 */

import { pushBinary, pushBinaryViaGitData, encodeRepoPath, GitHubApiError } from "@/lib/github";

export const OWNER = "Toylog123";
export const REPO = "rising-sun";
export const BRANCH = "main";

/** 附件存放目录（仓库根下，Pages 会把整个仓库根当站点根发布） */
export const UPLOAD_DIR = "uploads/meetings";

/** 单个附件上限 20 MB（base64 后约 27 MB，Contents API 可以接受） */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/**
 * GitHub 对「写操作」有二级速率限制：短时间大量 mutative 请求会被临时挡下。
 * 官方最佳实践是「串行发请求，相邻两次之间至少隔一秒」，所以批量上传 /
 * 批量删除时统一走这个等待。
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MeetingAttachment {
  /** 原始文件名（展示用） */
  name: string;
  /** 仓库内路径，如 "uploads/meetings/2026-11-07_a1b2c3_组会汇报.pdf" */
  path: string;
  /** 字节数 */
  size: number;
  /** blob sha，用于替换/删除时回写 */
  sha?: string;
  /** ISO 时间戳 */
  uploadedAt: string;
}

/** 把仓库路径编码成 API / URL 可用的形式（逐段编码，保留 /） */
export { encodeRepoPath };

/** Pages 直链：Content-Type 为 application/pdf，可 iframe 内嵌预览 */
export function pagesUrl(path: string): string {
  return `https://${OWNER}.github.io/${REPO}/${encodeRepoPath(path)}`;
}

/** raw 直链：始终最新，不受 Pages 构建与缓存延迟影响，适合下载 */
export function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeRepoPath(path)}`;
}

/** 人类可读的体积 */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** 去掉文件名里的危险字符，保留中文 */
export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\r\n\t]/g, "_").trim();
  return cleaned || "attachment.pdf";
}

/** File → base64（走 FileReader，比手写 btoa 快很多） */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

/** 校验文件是否可以作为附件上传 */
export function checkFile(file: File): { ok: boolean; reason?: string } {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return { ok: false, reason: `「${file.name}」不是 PDF 文件` };
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, reason: `「${file.name}」${formatBytes(file.size)}，超过 ${formatBytes(MAX_ATTACHMENT_BYTES)} 上限` };
  }
  if (file.size === 0) return { ok: false, reason: `「${file.name}」是空文件` };
  return { ok: true };
}

/** 生成仓库内的唯一文件名，避免同名互相覆盖 */
export function buildUploadPath(file: File, date?: string): string {
  const day = (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${UPLOAD_DIR}/${day}_${rand}_${sanitizeFileName(file.name)}`;
}

/**
 * 确保 `uploads/meetings/` 目录在远端存在。
 *
 * Contents API 一般会自动建中间目录，但这一点官方文档没有写死，
 * 所以这里做一层兜底：PUT 时若返回 404，就先用占位文件把目录建出来再重试。
 */
async function ensureUploadDir(token: string): Promise<void> {
  const dirs = UPLOAD_DIR.split("/");
  const body = btoa("# 占位文件，用于让 GitHub 仓库里存在该目录\n");
  for (let i = 1; i <= dirs.length; i++) {
    const dir = dirs.slice(0, i).join("/");
    const placeholder = `${dir}/.gitkeep`;
    try {
      await pushBinary(placeholder, body, token, `chore: 创建目录 ${dir}`);
    } catch (err) {
      // 409 = 文件已存在（目录早就建好了），忽略；其它错误也不致命，继续往下建
      if (err instanceof GitHubApiError && err.status === 409) continue;
    }
  }
}

/**
 * 上传一个附件到 GitHub 仓库，返回可存进 meetings.json 的元数据。
 *
 * 一次上传 = 一次独立 commit。文件名带随机后缀，所以不会和别人的同名文件
 * 互相覆盖，也不需要先查远端 sha。
 *
 * 写入顺序：先走 Contents API（简单、快）；如果它返回 404（多半是
 * `uploads/meetings/` 目录还没建出来），改走 Git Data API —— 它会连同
 * 中间目录一起建好。
 */
export async function uploadAttachment(
  file: File,
  token: string,
  date?: string
): Promise<MeetingAttachment> {
  const check = checkFile(file);
  if (!check.ok) throw new Error(check.reason ?? "文件不合法");
  if (!token) throw new Error("未配置 PAT，无法上传附件");

  const path = buildUploadPath(file, date);
  const base64 = await fileToBase64(file);
  const message = `docs: 上传组会附件 ${file.name}`;

  let sha: string;
  let size: number;
  try {
    ({ sha, size } = await pushBinary(path, base64, token, message));
  } catch (err) {
    if (!(err instanceof GitHubApiError) || err.status !== 404) throw err;

    // 目录不存在：换一条必定能建目录的路径
    try {
      ({ sha, size } = await pushBinaryViaGitData(path, base64, token, message));
    } catch {
      // 还是不行的话，先用占位文件把目录建出来，再走 Contents API
      await ensureUploadDir(token);
      ({ sha, size } = await pushBinary(path, base64, token, message));
    }
  }

  return {
    name: file.name,
    path,
    size: size || file.size,
    sha,
    uploadedAt: new Date().toISOString(),
  };
}

