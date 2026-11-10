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
  /** 展示名（也是下载下来的文件名），统一格式：姓名_汇报内容.pdf */
  name: string;
  /** 仓库内路径，如 "uploads/meetings/2026-11-07_a1b2c3_周雨时_AI4EDA综述.pdf" */
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

/** 文件名里禁用的字符（路径分隔符与 Windows 保留字符） */
const FORBIDDEN_CHARS = /[\\/:*?"<>|\r\n\t]/g;

/** 去掉文件名里的危险字符，保留中文 */
export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(FORBIDDEN_CHARS, "_").trim();
  return cleaned || "attachment.pdf";
}

/**
 * 组会材料的统一命名规范：**姓名_汇报内容.pdf**
 *
 * 举例：
 *   周雨时_AI4EDA六篇论文综述：数据集构建方法.pdf
 *   谢俊杰_SEU故障分析与加固优化：DMBF与ZACHO.pdf
 *
 * 为什么要统一：仓库里 PDF 直接用 Pages 预览 / raw 下载，
 * 文件名就是别人在浏览器里看到的标题，也是「谁汇报的、讲什么」的唯一线索。
 */

/** 汇报内容部分的最大长度（超出会在分隔符处截断） */
export const ATTACHMENT_NAME_MAX = 28;

/** 去掉空白与危险字符，用于拼接文件名 */
function namePart(text: string): string {
  return text.replace(FORBIDDEN_CHARS, "").replace(/\s+/g, " ").trim();
}

/**
 * 把一段文字压成适合放进文件名的短标题。
 *
 * 规则：去空白去危险字符；超过上限时优先在「：、，」这类分隔符处断开，
 * 断不开就硬截。中文场景下这样比硬截更自然。
 */
export function shortenForFileName(text: string, max: number = ATTACHMENT_NAME_MAX): string {
  const s = namePart(text).replace(/\s+/g, "");
  if (!s) return "";
  if (s.length <= max) return s;

  // 优先在「：、，,」处断开，且断点要落在后半段（太靠前会把标题砍没）
  const head = s.slice(0, max + 1);
  const cut = Math.max(
    head.lastIndexOf("："),
    head.lastIndexOf("、"),
    head.lastIndexOf("，"),
    head.lastIndexOf(",")
  );
  const out = cut > max / 2 ? head.slice(0, cut) : s.slice(0, max);
  return tidyTail(out);
}

/**
 * 收尾清理：去掉末尾的连接词与标点。
 *
 * 「…DMBF与」这种结尾读起来像被腰斩，所以把「与/和/的/及/或/：/、/，」这类
 * 挂在末尾的字符去掉。
 */
function tidyTail(text: string): string {
  return text.replace(/[与和的及或以及：、，,\s]+$/, "");
}

/**
 * 生成附件的统一展示名：姓名_汇报内容.pdf
 *
 * @param speaker 主讲人姓名
 * @param topic   汇报内容（通常就是组会记录里的议题标题）
 */
export function buildAttachmentName(speaker: string, topic: string): string {
  const who = namePart(speaker).replace(/\s+/g, "") || "汇报人";
  const what = shortenForFileName(topic) || "组会汇报";
  return `${who}_${what}.pdf`;
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

/**
 * 生成仓库内的唯一路径，避免同名互相覆盖。
 *
 * 路径格式：`uploads/meetings/{日期}_{随机后缀}_{姓名_汇报内容}.pdf`
 * 日期与随机后缀保证唯一性，随机后缀也避免同名文件互相覆盖；
 * 后半段用统一命名规范，浏览器下载下来就是「姓名_汇报内容.pdf」。
 */
export function buildUploadPath(displayName: string, date?: string): string {
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${UPLOAD_DIR}/${day}_${rand}_${sanitizeFileName(displayName)}`;
}

/**
 * 上传一个附件到 GitHub 仓库，返回可存进 meetings.json 的元数据。
 *
 * 一次上传 = 一次独立 commit。文件名带随机后缀，所以不会和别人的同名文件
 * 互相覆盖，也不需要先查远端 sha。
 *
 * 命名：统一按「姓名_汇报内容.pdf」规范生成（见 buildAttachmentName）。
 * 传了 speaker/topic 就按它们生成；没传就退回用原始文件名。
 *
 * 写入顺序：先走 Contents API（简单、快）。它虽然**实际会**自动创建缺失的
 * 中间目录（官方文档没写，但所有主流客户端都依赖这个行为），但有两个例外
 * 需要兜底：
 * - 仓库是空的 → Contents API 返 409 "Git Repository is empty"；
 * - 权限不对 → 返 404（classic PAT 缺 repo scope 时就是 404）。
 * 这两种情况都改走 Git Data API，它会自底向上把中间目录连同文件一起建好。
 */
export async function uploadAttachment(
  file: File,
  token: string,
  date?: string,
  speaker?: string,
  topic?: string
): Promise<MeetingAttachment> {
  const check = checkFile(file);
  if (!check.ok) throw new Error(check.reason ?? "文件不合法");
  if (!token) throw new Error("未配置 PAT，无法上传附件");

  // 统一命名：姓名_汇报内容.pdf
  const displayName =
    speaker && topic ? buildAttachmentName(speaker, topic) : sanitizeFileName(file.name);

  const path = buildUploadPath(displayName, date);
  const base64 = await fileToBase64(file);
  const message = `docs: 上传组会附件 ${displayName}`;

  let sha: string;
  let size: number;
  try {
    ({ sha, size } = await pushBinary(path, base64, token, message));
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 0;
    // 404 = 权限/仓库/分支不对；409 = 仓库为空。这两种都需要换通道
    if (status !== 404 && status !== 409) throw err;

    try {
      ({ sha, size } = await pushBinaryViaGitData(path, base64, token, message));
    } catch (gitErr) {
      // 两条通道都失败：把 Git Data 的错误透出去（它已经把 GitHub 原文
      // 翻译成人话了），但如果它比第一条更含糊，就保留第一条的错误
      if (gitErr instanceof GitHubApiError && gitErr.status === status) throw gitErr;
      throw err;
    }
  }

  return {
    name: displayName,
    path,
    size: size || file.size,
    sha,
    uploadedAt: new Date().toISOString(),
  };
}

