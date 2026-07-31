/**
 * 浏览器端下载工具
 */

export function downloadText(filename: string, content: string, mime = "text/markdown;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  triggerDownload(blob, filename);
}

export function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob(["﻿" + json], { type: "application/json;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/* ---------- Markdown 格式化工具 ---------- */

import type { Task } from "@/store/tasks";
import type { Meeting } from "@/store/meetings";

function fmtMembers(members: { name: string; role?: string; title?: string }[]): string {
  if (members.length === 0) return "_（暂无）_";
  return members
    .map((m) => {
      if (m.role === "teacher") return `**${m.name}**（${m.title ?? "老师"}）`;
      return `**${m.name}**`;
    })
    .join("、");
}

/** 导出任务列表为 Markdown */
export function tasksToMarkdown(opts: {
  advisor: string;
  members: { name: string; role?: string; title?: string }[];
  tasks: Task[];
  exportTime?: string;
}): string {
  const { advisor, members, tasks } = opts;
  const ts = opts.exportTime ?? new Date().toISOString().slice(0, 16).replace("T", " ");
  const lines: string[] = [];
  lines.push("# Rising Sun 课题组任务管理");
  lines.push("");
  lines.push(`> 导出时间：${ts}　·　指导老师：${advisor || "（未设置）"}`);
  lines.push("");

  // 成员
  lines.push("## 成员");
  lines.push("");
  lines.push(fmtMembers(members));
  lines.push("");
  lines.push("---");
  lines.push("");

  // 按成员分组
  const byMember = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.archived) continue;
    for (const a of t.assignees) {
      if (!byMember.has(a)) byMember.set(a, []);
      byMember.get(a)!.push(t);
    }
  }

  if (byMember.size === 0) {
    lines.push("_（暂无任务）_");
    return lines.join("\n");
  }

  // 排序：老师优先，然后拼音
  const sortedKeys = Array.from(byMember.keys()).sort((a, b) => {
    const ma = members.find((m) => m.name === a);
    const mb = members.find((m) => m.name === b);
    if (ma?.role === "teacher" && mb?.role !== "teacher") return -1;
    if (mb?.role === "teacher" && ma?.role !== "teacher") return 1;
    return a.localeCompare(b, "zh-CN");
  });

  for (const name of sortedKeys) {
    const member = members.find((m) => m.name === name);
    const displayName = member?.role === "teacher" ? `${name}（${member?.title ?? "老师"}）` : name;
    lines.push(`## 📌 ${displayName}`);
    lines.push("");
    const memberTasks = byMember.get(name) ?? [];
    for (const t of memberTasks) {
      const latest = t.updates[t.updates.length - 1];
      const status = latest?.status ?? "未开始";
      const date = latest?.date ?? t.createdAt;
      const progress = t.updates.length;
      lines.push(`### ${t.title}`);
      lines.push(`- **状态**：${status}`);
      lines.push(`- **创建时间**：${t.createdAt}`);
      lines.push(`- **最新进展**：${date} · 共 ${progress} 次更新`);
      if (latest?.note) lines.push(`- **备注**：${latest.note}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/** 导出组会记录为 Markdown */
export function meetingsToMarkdown(opts: {
  meetings: Meeting[];
  exportTime?: string;
}): string {
  const ts = opts.exportTime ?? new Date().toISOString().slice(0, 16).replace("T", " ");
  const sorted = [...opts.meetings].sort((a, b) => b.date.localeCompare(a.date));
  const lines: string[] = [];
  lines.push("# Rising Sun 课题组组会记录");
  lines.push("");
  lines.push(`> 导出时间：${ts}　·　共 ${sorted.length} 次组会`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (sorted.length === 0) {
    lines.push("_（暂无组会记录）_");
    return lines.join("\n");
  }

  for (const m of sorted) {
    lines.push(`## 📅 ${m.date}　·　${m.speaker}`);
    lines.push("");
    lines.push(`### 议题`);
    lines.push(m.topic || "_（无）_");
    lines.push("");
    if (m.notes) {
      lines.push("### 纪要");
      lines.push("");
      lines.push(m.notes);
      lines.push("");
    }
    if (m.decisions) {
      lines.push("### 决议");
      lines.push("");
      lines.push(m.decisions);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
