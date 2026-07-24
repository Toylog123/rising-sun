import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/tasks.json";
import { fetchTasks, pushTasks, GitHubApiError, type RemoteData } from "@/lib/github";

export interface TaskUpdate {
  date: string; // YYYY-MM-DD (组会日期)
  status: string; // 进行中 / 执行中 / 挂起 / 已完成 / 未开始
  note?: string;
}

export interface Task {
  id: string;
  advisor?: string;       // 所属指导老师（默认 = 全局 advisor）
  assignee: string;       // 成员名 或 "共同任务"
  title: string;
  createdAt: string;       // 创建 / 首次布置时间
  updates: TaskUpdate[];
  archived?: boolean;     // 是否已归档
  removedAt?: string;     // 手动删除时间（YYYY-MM-DD）；与 archived 区分"已完成归档"和"手动删除归档"
}

export type StudentStatus = "在读" | "休学" | "交流中" | "已毕业" | "退学";

export interface Student {
  name: string;            // 唯一主键
  enrolledAt: string;      // YYYY-MM 月精度
  status: StudentStatus;
  note?: string;
  advisor?: string;        // 默认继承全局 advisor
}

export type SyncStatus = "idle" | "pulling" | "pushing" | "error" | "ready";

export interface PushPayload {
  tasks: Task[];
  members: Student[];
  advisor: string;
}

interface TaskState {
  // 业务数据
  tasks: Task[];
  members: Student[];
  advisor: string;

  // 同步状态
  ghToken: string;
  remoteSha: string;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  syncError: string | null;

  // 业务 mutator
  addTask: (t: {
    advisor?: string;
    assignee: string;
    title: string;
    createdAt: string;
    status: string;
    note?: string;
  }) => void;
  addUpdate: (id: string, u: TaskUpdate) => void;
  removeTask: (id: string) => void;             // 永久删除（硬删）
  softRemoveTask: (id: string) => void;         // 软删除：archived=true + removedAt=今天
  removeUpdate: (id: string, index: number) => void;
  setArchived: (id: string, archived: boolean) => void;
  archiveCompleted: () => void;
  resetSeed: () => void;

  // 学生 mutator
  addStudent: (s: Omit<Student, "name"> & { name?: string }) => void;
  updateStudent: (name: string, patch: Partial<Omit<Student, "name">>) => void;
  removeStudent: (name: string) => void;

  // 同步 mutator
  setToken: (token: string) => void;
  clearToken: () => void;
  pull: () => Promise<void>;
  pushNow: () => Promise<void>;
}

/** 把任意形态的 members 数组标准化成 Student[]，兼容老版本 string[] */
function normalizeMembers(raw: unknown): Student[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return (raw as string[]).map((name) => ({
      name,
      enrolledAt: "",
      status: "在读" as StudentStatus,
    }));
  }
  // 假定已经是对象数组：补默认值
  return (raw as Array<Partial<Student>>).map((s) => ({
    name: s.name ?? "",
    enrolledAt: s.enrolledAt ?? "",
    status: (s.status ?? "在读") as StudentStatus,
    note: s.note,
    advisor: s.advisor,
  }));
}

/** 把任意形态的 tasks 数组标准化，缺 advisor 时默认填充全局 advisor */
function normalizeTasks(raw: unknown, defaultAdvisor: string): Task[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Partial<Task>>).map((t) => ({
    id: t.id ?? `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    advisor: t.advisor ?? defaultAdvisor,
    assignee: t.assignee ?? "共同任务",
    title: t.title ?? "",
    createdAt: t.createdAt ?? new Date().toISOString().slice(0, 10),
    updates: Array.isArray(t.updates) ? (t.updates as TaskUpdate[]) : [],
    archived: t.archived,
    removedAt: t.removedAt,
  }));
}

const seedTasks = normalizeTasks(seed.tasks, (seed.advisor as string) ?? "");
const seedMembers = normalizeMembers(seed.members);
const seedAdvisor = (seed.advisor as string) ?? "";

function sortUpdates(u: TaskUpdate[]): TaskUpdate[] {
  return [...u].sort((a, b) => a.date.localeCompare(b.date));
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => {
      // 闭包状态：debounce + mutex（不进入 React state）
      let pushTimer: ReturnType<typeof setTimeout> | null = null;
      let pushing = false;
      let pending = false;

      const pushInner = async (message: string) => {
        if (pushing) {
          pending = true;
          return;
        }
        pushing = true;
        try {
          const state = get();
          if (!state.ghToken) {
            set({ syncStatus: "error", syncError: "未配置 PAT，无法推送到 GitHub" });
            return;
          }
          if (!state.remoteSha) {
            set({ syncStatus: "error", syncError: "缺少文件 SHA，请先拉取一次远端" });
            return;
          }

          set({ syncStatus: "pushing", syncError: null });

          const data: RemoteData = {
            advisor: state.advisor,
            members: state.members,
            tasks: state.tasks,
          };

          let sha = state.remoteSha;
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const newSha = await pushTasks(data, sha, state.ghToken, message);
              set({
                remoteSha: newSha,
                syncStatus: "ready",
                lastSyncedAt: Date.now(),
                syncError: null,
              });
              return;
            } catch (err) {
              if (err instanceof GitHubApiError && err.status === 409 && attempt < maxAttempts) {
                const fresh = await fetchTasks();
                set({
                  tasks: normalizeTasks(fresh.data.tasks, fresh.data.advisor),
                  members: normalizeMembers(fresh.data.members),
                  advisor: fresh.data.advisor,
                  remoteSha: fresh.sha,
                });
                sha = fresh.sha;
                continue;
              }
              throw err;
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "推送失败";
          set({ syncStatus: "error", syncError: msg });
        } finally {
          pushing = false;
          if (pending) {
            pending = false;
            schedulePush("auto: queued changes");
          }
        }
      };

      const schedulePush = (message: string) => {
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
          pushTimer = null;
          void pushInner(message);
        }, 600);
      };

      const pullInner = async () => {
        try {
          set({ syncStatus: "pulling", syncError: null });
          const { data, sha } = await fetchTasks();
          set({
            tasks: normalizeTasks(data.tasks, data.advisor),
            members: normalizeMembers(data.members),
            advisor: data.advisor,
            remoteSha: sha,
            syncStatus: "ready",
            lastSyncedAt: Date.now(),
            syncError: null,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "拉取失败";
          set({ syncStatus: "error", syncError: msg });
        }
      };

      return {
        tasks: seedTasks,
        members: seedMembers,
        advisor: seedAdvisor,
        ghToken: "",
        remoteSha: "",
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,

        addTask: (t) => {
          const advisor = t.advisor || get().advisor;
          set((s) => ({
            tasks: [
              {
                id: `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                advisor,
                assignee: t.assignee,
                title: t.title,
                createdAt: t.createdAt,
                updates: [{ date: t.createdAt, status: t.status, note: t.note }],
              },
              ...s.tasks,
            ],
          }));
          schedulePush(`add: ${t.title}`);
        },
        addUpdate: (id, u) => {
          set((s) => ({
            tasks: s.tasks.map((x) =>
              x.id === id ? { ...x, updates: sortUpdates([...x.updates, u]) } : x
            ),
          }));
          schedulePush(`update: ${id}`);
        },
        removeTask: (id) => {
          set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
          schedulePush(`remove: ${id}`);
        },
        softRemoveTask: (id) => {
          set((s) => ({
            tasks: s.tasks.map((x) =>
              x.id === id ? { ...x, archived: true, removedAt: todayStr() } : x
            ),
          }));
          schedulePush(`soft-remove: ${id}`);
        },
        removeUpdate: (id, index) => {
          set((s) => ({
            tasks: s.tasks.map((x) =>
              x.id === id ? { ...x, updates: x.updates.filter((_, i) => i !== index) } : x
            ),
          }));
          schedulePush(`update-remove: ${id}`);
        },
        setArchived: (id, archived) => {
          set((s) => ({
            tasks: s.tasks.map((x) => (x.id === id ? { ...x, archived } : x)),
          }));
          schedulePush(archived ? `archive: ${id}` : `restore: ${id}`);
        },
        archiveCompleted: () => {
          set((s) => ({
            tasks: s.tasks.map((x) => {
              const last = x.updates[x.updates.length - 1];
              const done = last ? last.status.includes("完成") : false;
              return done ? { ...x, archived: true } : x;
            }),
          }));
          schedulePush(`archive-completed`);
        },
        resetSeed: () => {
          set({ tasks: seedTasks, members: seedMembers, advisor: seedAdvisor });
          schedulePush(`reset: reseed`);
        },

        // 学生管理
        addStudent: (s) => {
          const name = s.name?.trim() || "";
          if (!name) return;
          set((cur) => ({
            members: [...cur.members, { ...s, name }],
          }));
          schedulePush(`add-student: ${name}`);
        },
        updateStudent: (name, patch) => {
          set((s) => ({
            members: s.members.map((x) => (x.name === name ? { ...x, ...patch } : x)),
          }));
          schedulePush(`update-student: ${name}`);
        },
        removeStudent: (name) => {
          set((s) => ({ members: s.members.filter((x) => x.name !== name) }));
          schedulePush(`remove-student: ${name}`);
        },

        // 同步
        setToken: (token) => set({ ghToken: token.trim() }),
        clearToken: () => set({ ghToken: "", remoteSha: "", syncStatus: "idle", syncError: null }),
        pull: () => pullInner(),
        pushNow: () => pushInner("manual push"),
      };
    },
    {
      name: "rising-sun-tasks-v6",
      partialize: (state) => ({
        tasks: state.tasks,
        members: state.members,
        advisor: state.advisor,
        ghToken: state.ghToken,
        remoteSha: state.remoteSha,
      }),
    }
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

export const STATUS_OPTIONS = ["进行中", "挂起", "已完成", "未开始"];