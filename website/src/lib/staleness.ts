import type { Task, TaskUpdate } from "@/store/tasks";

/** 配色分档阈值：只影响颜色，显示的永远是真实天数 */
export const STALE_WARN_DAYS = 30;
export const STALE_STALE_DAYS = 90;

export type StaleLevel = "fresh" | "warn" | "stale";

export interface Staleness {
  /** 距上次更新的整天数，最小 0 */
  days: number;
  /** 最后一次有动静的日期 */
  lastDate: string;
  level: StaleLevel;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 严格解析 YYYY-MM-DD。
 * 额外做一次回写比对：Date 会把 "2026-02-30" 自动进位成 3 月 2 日，
 * 不比对的话这种脏数据会被当成合法日期，算出一个看似正常的错误天数。
 */
function parseDate(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const m = DATE_RE.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/**
 * 以本地零点为基准计算整天数。
 * 必须用本地时区拼日期，不能走 toISOString()——那会把东八区的时间折算成 UTC，
 * 结果不是差一天就是算出负数。跨夏令时那天实际间隔是 23/25 小时，所以用 round 吸收。
 */
export function daysSince(dateStr: string, now = new Date()): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
}

/**
 * 最新一条进展。
 * 不直接取数组最后一项：数据来自 GitHub 上的手改 JSON，未必按日期升序，
 * 而 stale / status 两处都要基于同一个"最新"判断，取错会得出互相矛盾的结论。
 */
function latestUpdate(t: Task): TaskUpdate | undefined {
  return t.updates.reduce<TaskUpdate | undefined>(
    (a, b) => (!a || b.date > a.date ? b : a),
    undefined
  );
}

/** 最后一次有动静的日期：优先最新进展，没有有效进展就退回创建时间 */
export function latestActivityDate(t: Task): string | null {
  const d = latestUpdate(t)?.date ?? t.createdAt;
  return parseDate(d) ? d : null;
}

/** 已收尾的任务（已完成 / 已归档）不再需要催更，配色保持中性 */
export function isClosed(t: Task): boolean {
  if (t.archived) return true;
  return (latestUpdate(t)?.status ?? "").includes("完成");
}

/**
 * 计算某个任务"多久没更新"。
 * 返回 null 表示日期完全不可用，此时界面不显示该字段，而不是显示一个假天数。
 */
export function stalenessOf(t: Task, now = new Date()): Staleness | null {
  const lastDate = latestActivityDate(t);
  if (lastDate === null) return null;
  const days = daysSince(lastDate, now);
  if (days === null) return null;

  const level: StaleLevel =
    isClosed(t) || days < STALE_WARN_DAYS
      ? "fresh"
      : days >= STALE_STALE_DAYS
      ? "stale"
      : "warn";
  return { days, lastDate, level };
}

/** 「最近更新 N 天前」：统一口径，所有任务一律显示真实天数 */
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