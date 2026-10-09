import type { Task } from "@/store/tasks";

/** 多久算"该更新了"（天）。超过 WARN 天亮黄色提醒，超过 STALE 天亮红色。 */
export const STALE_WARN_DAYS = 30;
export const STALE_STALE_DAYS = 90;

export type StaleLevel = "fresh" | "warn" | "stale";

export interface Staleness {
  /** 距上次更新的天数（已取整，最小 0） */
  days: number;
  /** 最后一次有动静的日期：优先最新进展，否则用创建时间 */
  lastDate: string;
  level: StaleLevel;
}

/** 已完成 / 已归档的任务不再需要提醒更新 */
export function needsUpdate(t: Task): boolean {
  if (t.archived) return false;
  const last = t.updates[t.updates.length - 1];
  const status = last?.status ?? "未开始";
  return !status.includes("完成");
}

function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 以本地零点为基准计算整天数，避免 toISOString 的时区偏移把结果算成负数 */
export function daysSince(dateStr: string, now = new Date()): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
}

export function stalenessOf(t: Task, now = new Date()): Staleness | null {
  if (!needsUpdate(t)) return null;
  const last = t.updates[t.updates.length - 1];
  const lastDate = last?.date ?? t.createdAt;
  const days = daysSince(lastDate, now);
  if (days === null) return null;
  const level: StaleLevel =
    days >= STALE_STALE_DAYS ? "stale" : days >= STALE_WARN_DAYS ? "warn" : "fresh";
  return { days, lastDate, level };
}

/** 徽章文案：30/60/120 天用更口语的说法，其余直接报天数 */
export function staleLabel(days: number): string {
  if (days >= 365) return "超过一年没动";
  if (days >= 180) return "半年没动了";
  if (days >= 90) return "三个月没动了";
  return `${days} 天没更新`;
}

/** 徽章配色 */
export const STALE_TONE: Record<StaleLevel, string> = {
  fresh: "",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  stale: "bg-red-50 text-red-700 border-red-200",
};