import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/tasks.json";

export interface TaskUpdate {
  date: string; // YYYY-MM-DD (组会日期)
  status: string; // 进行中 / 执行中 / 挂起 / 已完成 / 未开始
  note?: string;
}

export interface Task {
  id: string;
  assignee: string; // 成员名 或 "共同任务"
  title: string;
  createdAt: string; // 创建 / 首次布置时间
  updates: TaskUpdate[];
}

interface TaskState {
  tasks: Task[];
  members: string[];
  advisor: string;
  addTask: (t: { assignee: string; title: string; createdAt: string; status: string; note?: string }) => void;
  addUpdate: (id: string, u: TaskUpdate) => void;
  removeTask: (id: string) => void;
  removeUpdate: (id: string, index: number) => void;
  resetSeed: () => void;
}

const seedTasks = seed.tasks as Task[];
const seedMembers = seed.members as string[];
const seedAdvisor = (seed.advisor as string) ?? "";

function sortUpdates(u: TaskUpdate[]): TaskUpdate[] {
  return [...u].sort((a, b) => a.date.localeCompare(b.date));
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: seedTasks,
      members: seedMembers,
      advisor: seedAdvisor,
      addTask: (t) =>
        set((s) => ({
          tasks: [
            {
              id: `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              assignee: t.assignee,
              title: t.title,
              createdAt: t.createdAt,
              updates: [{ date: t.createdAt, status: t.status, note: t.note }],
            },
            ...s.tasks,
          ],
          members:
            s.members.includes(t.assignee) || t.assignee === "共同任务"
              ? s.members
              : [...s.members, t.assignee],
        })),
      addUpdate: (id, u) =>
        set((s) => ({
          tasks: s.tasks.map((x) =>
            x.id === id ? { ...x, updates: sortUpdates([...x.updates, u]) } : x
          ),
        })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),
      removeUpdate: (id, index) =>
        set((s) => ({
          tasks: s.tasks.map((x) =>
            x.id === id ? { ...x, updates: x.updates.filter((_, i) => i !== index) } : x
          ),
        })),
      resetSeed: () => set({ tasks: seedTasks, members: seedMembers, advisor: seedAdvisor }),
    }),
    { name: "rising-sun-tasks-v3" }
  )
);

export function latestUpdate(t: Task): TaskUpdate | undefined {
  return t.updates[t.updates.length - 1];
}
export function latestStatus(t: Task): string {
  return latestUpdate(t)?.status ?? "未开始";
}

export type Tone = "green" | "amber" | "gray" | "red";
export function statusTone(status: string): Tone {
  if (status.includes("完成")) return "green";
  if (status.includes("挂起")) return "red";
  if (status.includes("进行") || status.includes("执行")) return "amber";
  return "gray";
}

export function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const STATUS_OPTIONS = ["进行中", "执行中", "挂起", "已完成", "未开始"];
