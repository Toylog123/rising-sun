import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/achievements.json";
import { fetchAchievements, pushAchievements, GitHubApiError } from "@/lib/github";

export type AchievementType = "论文" | "专利" | "比赛" | "项目" | "获奖";

export const ACHIEVEMENT_TYPE_OPTIONS: AchievementType[] = ["论文", "专利", "比赛", "项目", "获奖"];

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  authors: string[];
  date: string;
  venue?: string;
  link?: string;
  note?: string;
}

export type SyncStatus = "idle" | "pulling" | "pushing" | "error" | "ready";

interface AchievementState {
  achievements: Achievement[];
  ghToken: string;
  remoteSha: string;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  syncError: string | null;

  addAchievement: (a: Omit<Achievement, "id">) => void;
  updateAchievement: (id: string, patch: Partial<Omit<Achievement, "id">>) => void;
  removeAchievement: (id: string) => void;
  pull: () => Promise<void>;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const seedAchievements = (seed.achievements as Achievement[]) ?? [];

function normalizeAchievements(raw: unknown): Achievement[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Partial<Achievement>>).map((a) => ({
    id: a.id ?? `ach-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: (a.type ?? "论文") as AchievementType,
    title: a.title ?? "",
    authors: Array.isArray(a.authors) ? a.authors : [],
    date: a.date ?? new Date().toISOString().slice(0, 10),
    venue: a.venue,
    link: a.link,
    note: a.note,
  }));
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => {
      let pushTimer: ReturnType<typeof setTimeout> | null = null;
      let pushing = false;

      const pushInner = async (message: string) => {
        if (pushing) {
          setTimeout(() => pushInner(message), 200);
          return;
        }
        pushing = true;
        try {
          const state = get();
          if (!state.ghToken) {
            set({ syncStatus: "error", syncError: "未配置 PAT" });
            return;
          }
          if (!state.remoteSha) {
            set({ syncStatus: "error", syncError: "缺少文件 SHA，请先拉取一次远端" });
            return;
          }
          set({ syncStatus: "pushing", syncError: null });
          let sha = state.remoteSha;
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const newSha = await pushAchievements({ achievements: state.achievements }, sha, state.ghToken, message);
              set({ remoteSha: newSha, syncStatus: "ready", lastSyncedAt: Date.now(), syncError: null });
              return;
            } catch (err) {
              if (err instanceof GitHubApiError && err.status === 409 && attempt < maxAttempts) {
                const fresh = await fetchAchievements();
                set({ achievements: normalizeAchievements(fresh.data.achievements), remoteSha: fresh.sha });
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
        }
      };

      const schedulePush = (msg: string) => {
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
          pushTimer = null;
          void pushInner(msg);
        }, 600);
      };

      const pullInner = async () => {
        try {
          set({ syncStatus: "pulling", syncError: null });
          const { data, sha } = await fetchAchievements();
          set({
            achievements: normalizeAchievements(data.achievements),
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
        achievements: seedAchievements,
        ghToken: "",
        remoteSha: "",
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,

        addAchievement: (a) => {
          const id = `ach-${a.date}-${Math.floor(Math.random() * 1000)}`;
          set((s) => ({ achievements: [{ ...a, id }, ...s.achievements] }));
          schedulePush(`add-achievement: ${a.title}`);
        },
        updateAchievement: (id, patch) => {
          set((s) => ({
            achievements: s.achievements.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          }));
          schedulePush(`update-achievement: ${id}`);
        },
        removeAchievement: (id) => {
          set((s) => ({ achievements: s.achievements.filter((x) => x.id !== id) }));
          schedulePush(`remove-achievement: ${id}`);
        },

        pull: () => pullInner(),
        setToken: (token) => set({ ghToken: token.trim() }),
        clearToken: () => set({ ghToken: "", remoteSha: "", syncStatus: "idle", syncError: null }),
      };
    },
    {
      name: "rising-sun-achievements-v1",
      partialize: (state) => ({
        achievements: state.achievements,
        ghToken: state.ghToken,
        remoteSha: state.remoteSha,
      }),
    }
  )
);