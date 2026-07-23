import type { Task } from "@/store/tasks";

// GitHub 仓库配置（与 vite.config.ts 的 base 一致）
const OWNER = "Toylog123";
const REPO = "rising-sun";
const PATH = "website/src/data/tasks.json";
const BRANCH = "main";

export interface RemoteData {
  advisor: string;
  members: string[];
  tasks: Task[];
}

export interface FetchResult {
  data: RemoteData;
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

/** 从 GitHub 拉取 tasks.json 内容 + sha（PUT 时需要 sha） */
export async function fetchTasks(): Promise<FetchResult> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
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
  // GitHub 返回 base64 编码内容，可能带换行
  const decoded = atob(json.content.replace(/\n/g, ""));
  return {
    data: JSON.parse(decoded) as RemoteData,
    sha: json.sha as string,
  };
}

/** 提交 tasks.json 到 GitHub（PUT API） */
export async function pushTasks(
  data: RemoteData,
  sha: string,
  token: string,
  message: string
): Promise<string> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  // 兼容中文 content
  const json = JSON.stringify(data, null, 2);
  const content = btoa(unescape(encodeURIComponent(json)));
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message,
      content,
      sha,
      branch: BRANCH,
    }),
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
  const json2 = await res.json();
  return json2.content.sha as string;
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
