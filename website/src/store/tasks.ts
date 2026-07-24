import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/tasks.json";
import { fetchTasks, pushTasks, GitHubApiError, type RemoteData } from "@/lib/github";

export interface TaskUpdate {
  date: string; // YYYY-MM-DD (组会日期)
  status: string; // 进行中 / 挂起 / 已完成 / 未开始
  note?: string;
}

export interface Task {
  id: string;
  advisor?: string;       // 所属指导老师（默认 = 全局 advisor）
  assignees: string[];    // 协同成员名单（学生名 / "共同任务"）
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

  // 手动同步：未提交的改动
  dirtyTaskIds: string[];        // 已改但未推送的任务 ID
  dirtyMembers: string[];        // 已改但未推送的学生姓名
  dirtyAdvisor: boolean;         // advisor 是否改动
  isPushing: boolean;            // 是否正在 pushAll
  pendingSummary: string[];      // 每次改动的简短描述（推送时作为 commit message）

  // 业务 mutator
  addTask: (t: {
    advisor?: string;
    assignees: string[];
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
  pushAll: () => Promise<void>;             // 推送所有 dirty 改动到 GitHub
  pushNow: () => Promise<void>;             // 兼容旧 API：等同 pushAll
  dirtyCount: () => number;                // dirty 项总数（task+member+advisor）
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

/** 把任意形态的 tasks 数组标准化；缺 advisor 时默认填充全局 advisor；
 *  旧版 assignee: string 自动迁移为 assignees: string[] */
function normalizeTasks(raw: unknown, defaultAdvisor: string): Task[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Partial<Task> & { assignee?: string | string[] }>).map((t) => {
    let assignees: string[];
    if (Array.isArray((t as Task).assignees)) {
      assignees = (t as Task).assignees;
    } else if (typeof t.assignee === "string") {
      // 兼容旧数据
      assignees = t.assignee ? [t.assignee] : ["共同任务"];
    } else if (Array.isArray(t.assignee)) {
      // 极端情况：assignee 已是数组（半迁移）
      assignees = t.assignee;
    } else {
      assignees = ["共同任务"];
    }
    return {
      id: t.id ?? `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      advisor: t.advisor ?? defaultAdvisor,
      assignees,
      title: t.title ?? "",
      createdAt: t.createdAt ?? new Date().toISOString().slice(0, 10),
      updates: Array.isArray(t.updates) ? (t.updates as TaskUpdate[]) : [],
      archived: t.archived,
      removedAt: t.removedAt,
    };
  });
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

          set({ syncStatus: "pushing", syncError: null, isPushing: true });

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
                // 推送成功：清空 dirty
                dirtyTaskIds: [],
                dirtyMembers: [],
                dirtyAdvisor: false,
                isPushing: false,
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
          set({ syncStatus: "error", syncError: msg, isPushing: false });
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
        dirtyTaskIds: [],
        dirtyMembers: [],
        dirtyAdvisor: false,
        isPushing: false,
        pendingSummary: [],

        addTask: (t) => {
          const advisor = t.advisor || get().advisor;
          const id = `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const who = t.assignees.join("、") || "共同任务";
          set((s) => ({
            tasks: [
              {
                id,
                advisor,
                assignees: t.assignees.length > 0 ? t.assignees : ["共同任务"],
                title: t.title,
                createdAt: t.createdAt,
                updates: [{ date: t.createdAt, status: t.status, note: t.note }],
              },
              ...s.tasks,
            ],
            dirtyTaskIds: [...new Set([...s.dirtyTaskIds, id])],
            pendingSummary: [...s.pendingSummary, `新建任务「${t.title}」（${who}）`],
          }));
        },
        addUpdate: (id, u) => {
          set((s) => {
            const t = s.tasks.find((x) => x.id === id);
            const title = t?.title ?? id;
            const who = (t?.assignees ?? []).join("、");
            const detail = u.note ? `${u.status}（${u.note}）` : u.status;
            return {
              tasks: s.tasks.map((x) =>
                x.id === id ? { ...x, updates: sortUpdates([...x.updates, u]) } : x
              ),
              dirtyTaskIds: s.dirtyTaskIds.includes(id) ? s.dirtyTaskIds : [...s.dirtyTaskIds, id],
              pendingSummary: [...s.pendingSummary, `更新「${title}」→ ${detail}（${who}）`],
            };
          });
        },
        removeTask: (id) => {
          set((s) => {
            const t = s.tasks.find((x) => x.id === id);
            return {
              tasks: s.tasks.filter((x) => x.id !== id),
              dirtyTaskIds: s.dirtyTaskIds.filter((x) => x !== id),
              pendingSummary: t ? [...s.pendingSummary, `永久删除任务「${t.title}」`] : s.pendingSummary,
            };
          });
        },
        softRemoveTask: (id) => {
          set((s) => {
            const t = s.tasks.find((x) => x.id === id);
            const title = t?.title ?? id;
            return {
              tasks: s.tasks.map((x) =>
                x.id === id ? { ...x, archived: true, removedAt: todayStr() } : x
              ),
              dirtyTaskIds: s.dirtyTaskIds.includes(id) ? s.dirtyTaskIds : [...s.dirtyTaskIds, id],
              pendingSummary: [...s.pendingSummary, `删除「${title}」（归档到「已删除」）`],
            };
          });
        },
        removeUpdate: (id, index) => {
          set((s) => {
            const t = s.tasks.find((x) => x.id === id);
            return {
              tasks: s.tasks.map((x) =>
                x.id === id ? { ...x, updates: x.updates.filter((_, i) => i !== index) } : x
              ),
              dirtyTaskIds: s.dirtyTaskIds.includes(id) ? s.dirtyTaskIds : [...s.dirtyTaskIds, id],
              pendingSummary: [...s.pendingSummary, `撤销任务「${t?.title ?? id}」的第 ${index + 1} 次进展`],
            };
          });
        },
        setArchived: (id, archived) => {
          set((s) => {
            const t = s.tasks.find((x) => x.id === id);
            const title = t?.title ?? id;
            return {
              tasks: s.tasks.map((x) => (x.id === id ? { ...x, archived } : x)),
              dirtyTaskIds: s.dirtyTaskIds.includes(id) ? s.dirtyTaskIds : [...s.dirtyTaskIds, id],
              pendingSummary: [...s.pendingSummary, `${archived ? "归档" : "恢复"}「${title}」`],
            };
          });
        },
        archiveCompleted: () => {
          const count = get().tasks.filter(
            (x) => !x.archived && latestStatus(x).includes("完成")
          ).length;
          set((s) => ({
            tasks: s.tasks.map((x) => {
              const last = x.updates[x.updates.length - 1];
              const done = last ? last.status.includes("完成") : false;
              return done ? { ...x, archived: true } : x;
            }),
            dirtyTaskIds: s.tasks
              .filter((x) => !x.archived)
              .map((x) => x.id)
              .filter((id) => !s.dirtyTaskIds.includes(id))
              .concat(s.dirtyTaskIds),
            pendingSummary: [...s.pendingSummary, `一键归档已完成任务（${count} 项）`],
          }));
        },
        resetSeed: () => {
          set((s) => ({
            tasks: seedTasks,
            members: seedMembers,
            advisor: seedAdvisor,
            dirtyTaskIds: seedTasks.map((t) => t.id),
            dirtyMembers: seedMembers.map((m) => m.name),
            dirtyAdvisor: true,
            pendingSummary: [...s.pendingSummary, `重置数据为初始种子`],
          }));
        },

        // 学生管理
        addStudent: (s) => {
          const name = s.name?.trim() || "";
          if (!name) return;
          set((cur) => ({
            members: [...cur.members, { ...s, name }],
            dirtyMembers: [...new Set([...cur.dirtyMembers, name])],
            pendingSummary: [...cur.pendingSummary, `添加学生「${name}」`],
          }));
        },
        updateStudent: (name, patch) => {
          set((s) => {
            const fields = Object.keys(patch).filter((k) => k !== "name");
            return {
              members: s.members.map((x) => (x.name === name ? { ...x, ...patch } : x)),
              dirtyMembers: s.dirtyMembers.includes(name) ? s.dirtyMembers : [...s.dirtyMembers, name],
              pendingSummary: [...s.pendingSummary, `修改学生「${name}」的 ${fields.join("、") || "信息"}`],
            };
          });
        },
        removeStudent: (name) => {
          set((s) => ({
            members: s.members.filter((x) => x.name !== name),
            dirtyMembers: s.dirtyMembers.filter((m) => m !== name),
            pendingSummary: [...s.pendingSummary, `移除学生「${name}」`],
          }));
        },

        // 同步
        setToken: (token) => set({ ghToken: token.trim() }),
        clearToken: () => set({ ghToken: "", remoteSha: "", syncStatus: "idle", syncError: null }),
        pull: () => pullInner(),
        pushNow: () => pushInner("manual push"),

        // 手动同步：推送所有 dirty 改动
        pushAll: async () => {
          const state = get();
          if (state.isPushing) return;
          const dirtyCount =
            state.dirtyTaskIds.length + state.dirtyMembers.length + (state.dirtyAdvisor ? 1 : 0);
          if (dirtyCount === 0) return;
          await pushInner(`commit: ${dirtyCount} changes`);
        },
        dirtyCount: () => {
          const s = get();
          return s.dirtyTaskIds.length + s.dirtyMembers.length + (s.dirtyAdvisor ? 1 : 0);
        },
      };
    },
    {
      name: "rising-sun-tasks-v7",
      partialize: (state) => ({
        tasks: state.tasks,
        members: state.members,
        advisor: state.advisor,
        ghToken: state.ghToken,
        remoteSha: state.remoteSha,
        dirtyTaskIds: state.dirtyTaskIds,
        dirtyMembers: state.dirtyMembers,
        dirtyAdvisor: state.dirtyAdvisor,
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