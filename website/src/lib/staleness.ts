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

/** 「最近更新 N 天前」：统一口径，所有任务一律显示真实天数，不再按 30/90 换说法 */
export function updatedAgoLabel(days: number): string {
  if (days <= 0) return "今天更新";
  if (days === 1) return "昨天更新";
  return `${days} 天前更新`;
}

/** 提醒配色：越久越刺眼（阈值只影响颜色，不影响显示口径） */
export const STALE_TONE: Record<StaleLevel, string> = {
  fresh: "text-[#6b6560]",
  warn: "text-amber-700",
  stale: "text-red-600 font-semibold",
};