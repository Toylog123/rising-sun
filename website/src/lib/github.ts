import type { Task, Student } from "@/store/tasks";
import type { Meeting } from "@/store/meetings";

// GitHub 仓库配置（与 vite.config.ts 的 base 一致）
const OWNER = "Toylog123";
const REPO = "rising-sun";
const BRANCH = "main";
const TASKS_PATH = "website/src/data/tasks.json";
const MEETINGS_PATH = "website/src/data/meetings.json";

export interface RemoteData {
  advisor: string;
  members: Student[];
  tasks: Task[];
}

export interface RemoteMeetingsData {
  meetings: Meeting[];
}

export interface FetchResult<T> {
  data: T;
  sha: string;
}

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "GitHubApiError";
  }
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

async function ghFetch(url: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    let msg = `拉取失败 (${res.status})`;
    if (res.status === 404) msg = "仓库或文件不存在，请检查仓库配置";
    if (res.status === 403) msg = "GitHub API 速率受限，请稍后再试";
    throw new GitHubApiError(msg, res.status);
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
    const err = await res.json().catch(() => ({}));
    let msg = err.message || `推送失败 (${res.status})`;
    if (res.status === 401) msg = "PAT 无效，请重新配置";
    if (res.status === 403) msg = "权限不足，请确认 PAT 勾选了 Contents: Write";
    if (res.status === 404) msg = "仓库或文件不存在";
    if (res.status === 409) msg = "冲突：远端有更新，将自动重试";
    if (res.status === 422) msg = "sha 不匹配，请刷新后重试";
    throw new GitHubApiError(msg, res.status);
  }
  const json = await res.json();
  return json.content.sha as string;
}

/** 从 GitHub 拉取 tasks.json */
export async function fetchTasks(): Promise<FetchResult<RemoteData>> {
  const { content, sha } = await ghFetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${TASKS_PATH}`);
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

/** 从 GitHub 拉取 meetings.json */
export async function fetchMeetings(): Promise<FetchResult<RemoteMeetingsData>> {
  const { content, sha } = await ghFetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${MEETINGS_PATH}`);
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