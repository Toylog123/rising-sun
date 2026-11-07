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
    // GitHub 有时返回非 JSON 错误体，这时 message 是占位符，按「没有消息」处理
    const isPlaceholder = !message || message === `请求失败 (${res.status})`;
    // 401/403 的翻译逻辑与二进制上传共用（GitHub 默认返回 "Bad credentials"）
    let msg = friendlyBinaryError(res.status, isPlaceholder ? "" : message);
    // JSON 写入特有的几种情况（sha 不匹配等）说更具体的话
    if (res.status === 404 && isPlaceholder) msg = "仓库或文件不存在";
    if (res.status === 409 && isPlaceholder) msg = "冲突：远端有更新，将自动重试";
    if (res.status === 422 && isPlaceholder) msg = "sha 不匹配，请刷新后重试";
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
 * 把 GitHub 的原始错误翻译成用户能看懂的话。
 *
 * 单独抽出来是为了能直接跑单元测试（见 uploads.test.mjs）。
 */
export function friendlyBinaryError(status: number, message: string): string {
  // 401 一定是 token 的问题，统一说人话（GitHub 默认返回 "Bad credentials"）
  if (status === 401) return "PAT 无效或已过期，请重新配置";
  if (status === 403) {
    if (message.toLowerCase().includes("rate limit")) {
      return "GitHub API 速率受限，请稍后再试";
    }
    // GitHub App 权限不足时是 403；classic PAT 权限不足则报 404（见下）
    return "PAT 权限不足：写文件需要仓库的 Contents 读写权限（repo scope）";
  }
  // 404 不是「目录不存在」——Contents API 的 PUT 会自动创建缺失的中间目录。
  // 真正的原因是仓库/分支/权限不对（classic PAT 缺 repo scope 时就是 404）。
  if (status === 404) {
    return "仓库、分支或权限有问题：请确认 PAT 有 Contents 读写权限（repo scope），且分支存在";
  }
  if (status === 409) {
    // 空仓库时 Contents API 会报 "Git Repository is empty"
    if (message.toLowerCase().includes("empty")) {
      return "仓库是空的，无法用 Contents API 写入（已改走 Git Data API 建目录）";
    }
    if (!message) return "冲突：远端有更新，请重试";
  }
  if (status === 422) {
    if (!message) return "校验失败：文件过大或内容非法";
    // GitHub 拒绝超大请求体时的原文（Contents API / Blobs API 各一句）：
    //   "Sorry, the file is too large to be processed..."
    //   "Sorry, your input was too large to process..."
    // 官方没公布具体上限，实测在 ~50 MB 请求体附近（base64 会把体积放大 1/3）。
    if (message.toLowerCase().includes("too large")) {
      return "文件太大，GitHub 拒绝了这次上传（单次请求体上限约 50 MB，base64 后体积再涨 1/3）。请压缩 PDF 后重试。";
    }
  }
  return message;
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
    throw new GitHubApiError(friendlyBinaryError(res.status, m), res.status, resetAt);
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
    throw new GitHubApiError(
      friendlyBinaryError(res.status, m) || `删除失败 (${res.status})`,
      res.status,
      resetAt
    );
  }
}

/* ---------- Git Data API（Git Data 兜底通道） ---------- */

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
    // Blobs API 拒绝超大请求体时的原文：'Sorry, your input was too large to
    // process...'（和 Contents API 的 422 是同一个 ~50 MB 请求体上限）
    const msg = friendlyBinaryError(res.status, message || `Git Data API 请求失败 (${res.status})`);
    throw new GitHubApiError(msg, res.status, resetAt);
  }
  return (await res.json()) as T;
}

/** 在一个 tree 里按名字找某个条目 */
async function findTreeEntry(
  treeSha: string,
  name: string,
  token: string
): Promise<{ sha: string; type: string } | null> {
  const tree = await gitDataRequest<{ tree?: Array<{ path: string; sha: string; type: string }> }>(
    `git/trees/${treeSha}`,
    token,
    { method: "GET" }
  );
  const hit = (tree.tree ?? []).find((e) => e.path === name);
  return hit ? { sha: hit.sha, type: hit.type } : null;
}

/**
 * 用 Git Data API 写一个文件，并且**保证**中间目录被建出来。
 *
 * 为什么需要这条路径：
 * - Contents API 的 PUT 虽然实际上会自动创建缺失的中间目录（官方没写，但
 *   所有主流客户端都依赖这个行为），但它对**空仓库**会返回 409
 *   （"Git Repository is empty"），这时必须走 Git Data API。
 * - Git Trees API 的 `path` 字段官方只写成 "The file referenced in the tree"，
 *   **没有承诺**带斜杠的路径会自动建出中间树。所以这里用官方安全的
 *   **自底向上**配方：先建最深的目录（放文件），再逐级用 `040000` 的 tree
 *   条目把上一级包上去，最后包进根树。每一次建树都带上这一层目录**原有
 *   的 tree sha 作为 base_tree**，这样同目录下的其它文件不会被这次提交删掉。
 *
 * 参数 path 例："uploads/meetings/2026-11-07_xxx_汇报.pdf"
 */
export async function pushBinaryViaGitData(
  path: string,
  base64: string,
  token: string,
  message: string
): Promise<{ sha: string; size: number }> {
  // 1) 造 blob（二进制只能走 blob，tree 的 content 字段是纯文本）
  const blob = await gitDataRequest<{ sha: string; size: number }>(
    "git/blobs",
    token,
    { method: "POST", body: { content: base64, encoding: "base64" } }
  );

  const segments = path.split("/").filter(Boolean);
  const fileName = segments.pop() as string;
  const dirs = segments;

  // 2) 读当前分支头 → 建树 → 提交 → 推进分支指针（不用 force）
  //
  // 这几步之间不是原子的：期间别人推了新提交的话，这次更新就不是
  // fast-forward，GitHub 会拒绝（422 "Reference update failed" / 409）。
  // 这时重读一次 head，重做树和提交再来一遍。
  for (let attempt = 0; attempt < 3; attempt++) {
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

    /**
     * 顺着 head 的树往下走 count 层，返回第 count 层目录所在的 tree sha。
     * 走不通（目录不存在 / 不是 tree）就返回 undefined。
     */
    const walkToTree = async (count: number): Promise<string | undefined> => {
      let cur = headCommit.tree.sha;
      for (let i = 0; i < count; i++) {
        const entry = await findTreeEntry(cur, dirs[i], token);
        if (!entry || entry.type !== "tree") return undefined;
        cur = entry.sha;
      }
      return cur;
    };

    /**
     * 建出 dirs[0..depth] 这个**目录本身**的 tree（含它下面的内容）。
     * base_tree 用这一层目录原有的 tree sha，保住同目录的其它文件。
     */
    const buildDirTree = async (depth: number): Promise<string> => {
      // 这一层目录里放什么
      const entries =
        depth === dirs.length - 1
          ? // 最深一层：放文件
            [{ path: fileName, mode: "100644", type: "blob", sha: blob.sha }]
          : // 上面几层：放下一层目录（040000 = subdirectory）
            [
              {
                path: dirs[depth + 1],
                mode: "040000",
                type: "tree",
                sha: await buildDirTree(depth + 1),
              },
            ];

      // 这一层目录原有的 tree（用来当 base_tree）
      let baseTree: string | undefined;
      if (depth > 0) {
        const parentTree = await walkToTree(depth);
        if (parentTree) {
          const self = await findTreeEntry(parentTree, dirs[depth], token);
          if (self && self.type === "tree") baseTree = self.sha;
        }
      } else {
        baseTree = headCommit.tree.sha;
      }

      const tree = await gitDataRequest<{ sha: string }>("git/trees", token, {
        method: "POST",
        body: {
          ...(baseTree ? { base_tree: baseTree } : {}),
          tree: entries,
        },
      });
      return tree.sha;
    };

    // 根树：文件在根目录就直接放文件，否则放最外层目录
    const rootTreeSha =
      dirs.length === 0
        ? (
            await gitDataRequest<{ sha: string }>("git/trees", token, {
              method: "POST",
              body: {
                base_tree: headCommit.tree.sha,
                tree: [{ path: fileName, mode: "100644", type: "blob", sha: blob.sha }],
              },
            })
          ).sha
        : (
            await gitDataRequest<{ sha: string }>("git/trees", token, {
              method: "POST",
              body: {
                base_tree: headCommit.tree.sha,
                tree: [
                  {
                    path: dirs[0],
                    mode: "040000",
                    type: "tree",
                    sha: await buildDirTree(0),
                  },
                ],
              },
            })
          ).sha;

    const commit = await gitDataRequest<{ sha: string }>("git/commits", token, {
      method: "POST",
      body: { message, tree: rootTreeSha, parents: [headSha] },
    });
    try {
      await gitDataRequest(`git/refs/heads/${BRANCH}`, token, {
        method: "PATCH",
        body: { sha: commit.sha, force: false },
      });
      return { sha: blob.sha, size: blob.size };
    } catch (err) {
      // 422/409 = 期间有人推了新提交 → 重读 head 再来一次
      const conflict =
        err instanceof GitHubApiError && (err.status === 422 || err.status === 409);
      if (!conflict || attempt === 2) throw err;
    }
  }
  throw new GitHubApiError("更新分支失败：远端持续有新提交，请稍后重试", 409);
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