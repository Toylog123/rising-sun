import type { Task, Student } from "@/store/tasks";
import type { Meeting } from "@/store/meetings";
import type { Achievement } from "@/store/achievements";

// GitHub 仓库配置（与 vite.config.ts 的 base 一致）
const OWNER = "Toylog123";
const REPO = "rising-sun";
const BRANCH = "main";
const TASKS_PATH = "website/src/data/tasks.json";
const MEETINGS_PATH = "website/src/data/meetings.json";
const ACHIEVEMENTS_PATH = "website/src/data/achievements.json";

export interface RemoteData {
  advisor: string;
  members: Student[];
  tasks: Task[];
}

export interface RemoteMeetingsData {
  meetings: Meeting[];
}

export interface RemoteAchievementsData {
  achievements: Achievement[];
}

export interface FetchResult<T> {
  data: T;
  sha: string;
}

export class GitHubApiError extends Error {
  status: number;
  resetAt: number | null; // 限速恢复时间（epoch ms），null = 未知
  constructor(message: string, status: number, resetAt: number | null = null) {
    super(message);
    this.status = status;
    this.resetAt = resetAt;
    this.name = "GitHubApiError";
  }
}

/** 解析 GitHub 错误响应：消息 + rate limit reset 时间 */
async function parseGitHubError(res: Response): Promise<{ message: string; resetAt: number | null }> {
  let msg = `请求失败 (${res.status})`;
  let resetAt: number | null = null;
  try {
    const body = await res.json();
    if (body && typeof body.message === "string") msg = body.message;
  } catch {
    // ignore
  }
  // GitHub 限速头（未认证时通常没有，但拉取用户信息可能有）
  const resetHeader = res.headers.get("X-RateLimit-Reset");
  if (resetHeader) {
    const sec = parseInt(resetHeader, 10);
    if (!isNaN(sec)) resetAt = sec * 1000;
  }
  return { message: msg, resetAt };
}

/** UTF-8 字符串 → base64（正确处理中文等多字节字符） */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** base64 → UTF-8 字符串（正确处理中文等多字节字符） */
function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

async function ghFetch(url: string, token?: string): Promise<{ content: string; sha: string }> {
  const baseHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // 带 PAT 拉取可把配额从 60 次/小时/IP 提升到 5000 次/小时
  let res = await fetch(url, {
    headers: { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  // PAT 过期/无效时 GitHub 返回 401：降级为匿名拉取，保证浏览等只读功能不受影响
  if (res.status === 401 && token) {
    res = await fetch(url, { headers: baseHeaders });
  }
  if (!res.ok) {
    const { message, resetAt } = await parseGitHubError(res);
    let msg = message;
    if (res.status === 404 && !message) msg = "仓库或文件不存在，请检查仓库配置";
    if (res.status === 403 && (message.toLowerCase().includes("rate limit") || !message)) {
      msg = "GitHub API 速率受限，请稍后再试";
    }
    throw new GitHubApiError(msg, res.status, resetAt);
  }
  const json = await res.json();
  return { content: json.content, sha: json.sha };
}

async function ghPut(
  url: string,
  data: unknown,
  sha: string,
  token: string,
  message: string
): Promise<string> {
  const content = utf8ToBase64(JSON.stringify(data, null, 2));
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ message, content, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const { message, resetAt } = await parseGitHubError(res);
    let msg = message;
    // 401 一定是 token 的问题，统一说人话（GitHub 默认返回 "Bad credentials"）
    if (res.status === 401) msg = "PAT 无效或已过期，请重新配置";
    if (res.status === 403 && (message.toLowerCase().includes("rate limit") || (!message || message === `请求失败 (${res.status})`))) {
      msg = "GitHub API 速率受限，请稍后再试";
    }
    if (res.status === 404 && !message) msg = "仓库或文件不存在";
    if (res.status === 409 && !message) msg = "冲突：远端有更新，将自动重试";
    if (res.status === 422 && !message) msg = "sha 不匹配，请刷新后重试";
    throw new GitHubApiError(msg, res.status, resetAt);
  }
  const json = await res.json();
  return json.content.sha as string;
}

/** 从 GitHub 拉取 tasks.json（带 token 时使用认证配额） */
export async function fetchTasks(token?: string): Promise<FetchResult<RemoteData>> {
  const { content, sha } = await ghFetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${TASKS_PATH}`, token);
  return { data: JSON.parse(base64ToUtf8(content.replace(/\n/g, ""))), sha };
}

/** 提交 tasks.json */
export async function pushTasks(
  data: RemoteData,
  sha: string,
  token: string,
  message: string
): Promise<string> {
  return ghPut(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${TASKS_PATH}`,
    data,
    sha,
    token,
    message
  );
}

/** 从 GitHub 拉取 meetings.json（带 token 时使用认证配额） */
export async function fetchMeetings(token?: string): Promise<FetchResult<RemoteMeetingsData>> {
  const { content, sha } = await ghFetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${MEETINGS_PATH}`, token);
  return { data: JSON.parse(base64ToUtf8(content.replace(/\n/g, ""))), sha };
}

/** 提交 meetings.json */
export async function pushMeetings(
  data: RemoteMeetingsData,
  sha: string,
  token: string,
  message: string
): Promise<string> {
  return ghPut(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${MEETINGS_PATH}`,
    data,
    sha,
    token,
    message
  );
}

/** 从 GitHub 拉取 achievements.json（带 token 时使用认证配额） */
export async function fetchAchievements(token?: string): Promise<FetchResult<RemoteAchievementsData>> {
  const { content, sha } = await ghFetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${ACHIEVEMENTS_PATH}`, token);
  return { data: JSON.parse(base64ToUtf8(content.replace(/\n/g, ""))), sha };
}

/** 提交 achievements.json */
export async function pushAchievements(
  data: RemoteAchievementsData,
  sha: string,
  token: string,
  message: string
): Promise<string> {
  return ghPut(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${ACHIEVEMENTS_PATH}`,
    data,
    sha,
    token,
    message
  );
}

/* ---------- 二进制文件（附件）上传 ---------- */

/**
 * 把仓库路径编码成 API / URL 可用的形式（逐段编码，保留 /）。
 *
 * 文件名里可能有中文，URL 里必须百分号编码；
 * 但路径分隔符 / 要保留，所以不能直接对整串 encodeURIComponent。
 */
export function encodeRepoPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** Contents API 的单个文件 URL */
function contentsUrl(path: string): string {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(path)}`;
}

/**
 * 上传一个二进制文件到仓库（Contents API）。
 *
 * 与 ghPut 的区别：ghPut 只接受 JSON 对象（内部 JSON.stringify），
 * 这里直接传已经编码好的 base64 字符串，支持任意二进制内容。
 */
export async function pushBinary(
  path: string,
  base64: string,
  token: string,
  message: string,
  sha?: string
): Promise<{ sha: string; size: number }> {
  const res = await fetch(contentsUrl(path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message,
      content: base64,
      ...(sha ? { sha } : {}),
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    const { message: m, resetAt } = await parseGitHubError(res);
    let msg = m;
    // 401 一定是 token 的问题，统一说人话（GitHub 默认返回 "Bad credentials"）
    if (res.status === 401) msg = "PAT 无效或已过期，请重新配置";
    if (res.status === 403 && (m.toLowerCase().includes("rate limit") || !m)) {
      msg = "GitHub API 速率受限，请稍后再试";
    }
    if (res.status === 404 && !m) msg = "仓库或文件不存在";
    if (res.status === 409 && !m) msg = "冲突：远端有更新，请重试";
    if (res.status === 422 && !m) msg = "校验失败：文件过大或内容非法";
    throw new GitHubApiError(msg, res.status, resetAt);
  }
  const json = await res.json();
  // 大于 1 MB 的文件，响应里的 content 可能不带 sha（只有 raw/object media type 完整）。
  // 这时退回用 GET 单独取一次 sha，保证调用方拿到的 sha 一定是准的。
  const content = json?.content;
  if (content?.sha) {
    return { sha: content.sha as string, size: (content.size as number) ?? 0 };
  }
  const fallback = await fetchFileSha(path, token);
  if (!fallback) {
    throw new GitHubApiError("上传成功但无法读取文件 sha", 500);
  }
  return { sha: fallback, size: (content?.size as number) ?? 0 };
}

/**
 * 读取某个附件的 blob sha（用于替换/删除时定位远端文件）。
 *
 * 用 `application/vnd.github.object+json` 媒体类型：官方文档说明文件大于 1 MB 时
 * 默认 JSON 媒体类型会被拒（"This API returns blobs up to 1 MB in size"），
 * 只有 raw / object 媒体类型可用；object 媒体类型仍然带 sha 字段。
 */
export async function fetchFileSha(path: string, token?: string): Promise<string | null> {
  const res = await fetch(contentsUrl(path), {
    headers: {
      Accept: "application/vnd.github.object+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.sha as string) ?? null;
}

/** 删除仓库中的一个附件 */
export async function deleteFile(
  path: string,
  sha: string,
  token: string,
  message: string
): Promise<void> {
  const res = await fetch(contentsUrl(path), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const { message: m, resetAt } = await parseGitHubError(res);
    throw new GitHubApiError(m || `删除失败 (${res.status})`, res.status, resetAt);
  }
}

/* ---------- Git Data API（附件目录兜底创建） ---------- */

async function gitDataRequest<T>(
  endpoint: string,
  token: string,
  init: { method: "GET" | "POST" | "PATCH"; body?: unknown }
): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/${endpoint}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!res.ok) {
    const { message, resetAt } = await parseGitHubError(res);
    throw new GitHubApiError(message || `Git Data API 请求失败 (${res.status})`, res.status, resetAt);
  }
  return (await res.json()) as T;
}

/**
 * 用 Git Data API 写一个文件（自动创建中间目录）。
 *
 * 为什么需要这条路径：Contents API 的 PUT 在「父目录不存在」时的行为官方
 * 没有写清楚（社区讨论页也抓不到）。Git Trees API 的官方说明则明确写着
 * "The tree creation API accepts nested entries"，所以把它作为兜底：
 * Contents API 报 404 时改走这里，一次 commit 既建目录又写文件。
 */
export async function pushBinaryViaGitData(
  path: string,
  base64: string,
  token: string,
  message: string
): Promise<{ sha: string; size: number }> {
  // 1) 造 blob
  const blob = await gitDataRequest<{ sha: string; size: number }>(
    "git/blobs",
    token,
    { method: "POST", body: { content: base64, encoding: "base64" } }
  );

  // 2) 读当前分支头提交（拿 base_tree）
  const ref = await gitDataRequest<{ object: { sha: string } }>(
    `git/ref/heads/${BRANCH}`,
    token,
    { method: "GET" }
  );
  const headSha = ref.object.sha;
  const headCommit = await gitDataRequest<{ tree: { sha: string } }>(
    `git/commits/${headSha}`,
    token,
    { method: "GET" }
  );

  // 3) 在当前树基础上加一个嵌套路径（目录会被自动建出来）
  const tree = await gitDataRequest<{ sha: string }>("git/trees", token, {
    method: "POST",
    body: {
      base_tree: headCommit.tree.sha,
      tree: [{ path, mode: "100644", type: "blob", sha: blob.sha }],
    },
  });

  // 4) 提交
  const commit = await gitDataRequest<{ sha: string }>("git/commits", token, {
    method: "POST",
    body: { message, tree: tree.sha, parents: [headSha] },
  });

  // 5) 推进分支指针（不用 force，避免覆盖别人的提交）
  try {
    await gitDataRequest(`git/refs/heads/${BRANCH}`, token, {
      method: "PATCH",
      body: { sha: commit.sha, force: false },
    });
  } catch (err) {
    // 422 = 期间有人推了新提交，重读一次 head 再来
    if (err instanceof GitHubApiError && err.status === 422) {
      const ref2 = await gitDataRequest<{ object: { sha: string } }>(
        `git/ref/heads/${BRANCH}`,
        token,
        { method: "GET" }
      );
      const headSha2 = ref2.object.sha;
      const headCommit2 = await gitDataRequest<{ tree: { sha: string } }>(
        `git/commits/${headSha2}`,
        token,
        { method: "GET" }
      );
      const tree2 = await gitDataRequest<{ sha: string }>("git/trees", token, {
        method: "POST",
        body: {
          base_tree: headCommit2.tree.sha,
          tree: [{ path, mode: "100644", type: "blob", sha: blob.sha }],
        },
      });
      const commit2 = await gitDataRequest<{ sha: string }>("git/commits", token, {
        method: "POST",
        body: { message, tree: tree2.sha, parents: [headSha2] },
      });
      await gitDataRequest(`git/refs/heads/${BRANCH}`, token, {
        method: "PATCH",
        body: { sha: commit2.sha, force: false },
      });
    } else {
      throw err;
    }
  }

  return { sha: blob.sha, size: blob.size };
}

/** 仅测试 token 是否有效（拉取一次） */
export async function testToken(token: string): Promise<{ ok: boolean; user?: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return { ok: false };
  const json = await res.json();
  return { ok: true, user: json.login as string };
}

/** 友好显示"X 秒/X 分/X 小时前" */
export function timeAgo(ts: number | null): string {
  if (!ts) return "从未同步";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}