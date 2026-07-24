import type { Student } from "@/store/tasks";

export const STUDENT_STATUS_OPTIONS: Student["status"][] = [
  "在读",
  "休学",
  "交流中",
  "已毕业",
  "退学",
];

export type GradeInfo = {
  label: string;
  yearsAtLab: number;
};

/**
 * 根据入校时间（"YYYY-MM"）计算当前年级（按学年 9 月起算）
 *
 * 规则：
 * - 入校时间所在年 9 月及之后 → 该年入学
 * - 入校时间所在年 9 月之前 → 上一年入学
 * - 当前月份 ≥ 9 月 → 升一年级；否则按上一年算
 */
export function calcGrade(enrolledAt: string, now: Date = new Date()): GradeInfo {
  const result: GradeInfo = { label: "未知", yearsAtLab: 0 };

  if (!enrolledAt) return result;

  const parts = enrolledAt.split("-").map(Number);
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return result;

  const [y, m] = parts;
  const startYear = m >= 9 ? y : y - 1;
  const monthNow = now.getMonth() + 1;
  const yearDiff = now.getFullYear() - startYear;
  const offset = monthNow >= 9 ? 1 : 0;
  const grade = yearDiff + offset;

  result.yearsAtLab = Math.max(0, yearDiff + (monthNow >= m ? 0 : 0));

  if (grade <= 0) result.label = "未入学";
  else if (grade === 1) result.label = "研一";
  else if (grade === 2) result.label = "研二";
  else if (grade === 3) result.label = "研三";
  else result.label = `研${grade}（延期）`;

  return result;
}

/** 简易：入校时长（年），用于排序 / 显示 */
export function yearsAtLab(enrolledAt: string, now: Date = new Date()): number {
  const info = calcGrade(enrolledAt, now);
  return info.yearsAtLab;
}

/** 状态对应的卡片色调 */
export function statusToneStudent(status: string): "green" | "amber" | "gray" | "red" | "blue" {
  if (status === "在读") return "green";
  if (status === "交流中") return "blue";
  if (status === "休学" || status === "退学") return "red";
  if (status === "已毕业") return "gray";
  return "amber";
}