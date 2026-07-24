import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/achievements.json";
import { fetchAchievements, pushAchievements, GitHubApiError } from "@/lib/github";

/** 成果类型分三类：论文 / 专利 / 比赛获奖 */
export type AchievementCategory = "论文" | "专利" | "比赛";

/** JCR 分区 */
export const JCR_OPTIONS = ["Q1", "Q2", "Q3", "Q4"] as const;
export type JcrZone = (typeof JCR_OPTIONS)[number];

/** 中科院分区 */
export const CAS_OPTIONS = ["1区", "2区", "3区", "4区"] as const;
export type CasZone = (typeof CAS_OPTIONS)[number];

/** 专利状态 */
export const PATENT_STATUS = ["申请中", "授权", "实审"] as const;
export type PatentStatus = (typeof PATENT_STATUS)[number];

/** 比赛奖项等级（示例，可输入） */
export const AWARD_LEVELS = ["特等奖", "一等奖", "二等奖", "三等奖", "金奖", "银奖", "铜奖", "优胜奖"] as const;

interface AchievementBase {
  id: string;
  category: AchievementCategory;
  year: string;          // YYYY
  authors: string[];     // 发明人 / 获奖成员 / 论文作者
  note?: string;
  link?: string;
}

/** 论文 */
export interface PaperAchievement extends AchievementBase {
  category: "论文";
  title: string;          // 论文标题
  venue: string;          // 会议/期刊名
  jcr?: JcrZone;          // JCR 分区
  cas?: CasZone;          // 中科院分区
  correspondingAuthors?: string[];  // 通讯作者
}

/** 专利 */
export interface PatentAchievement extends AchievementBase {
  category: "专利";
  name: string;           // 专利名称
  patentNo?: string;      // 专利号
  status?: PatentStatus;
}

/** 比赛获奖 */
export interface CompetitionAchievement extends AchievementBase {
  category: "比赛";
  competition: string;    // 比赛名
  award: string;          // 奖项（如 一等奖）
  advisors?: string[];    // 指导老师
}

export type Achievement = PaperAchievement | PatentAchievement | CompetitionAchievement;

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
  return raw.map((a: any) => {
    const base = {
      id: a.id ?? `ach-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      year: a.year ?? a.date?.slice(0, 4) ?? new Date().getFullYear().toString(),
      authors: Array.isArray(a.authors) ? a.authors : [],
      note: a.note,
      link: a.link,
    };
    if (a.category === "专利") {
      return { ...base, category: "专利", name: a.name ?? a.title ?? "", patentNo: a.patentNo, status: a.status };
    }
    if (a.category === "比赛") {
      return {
        ...base,
        category: "比赛",
        competition: a.competition ?? a.title ?? "",
        award: a.award ?? "",
        advisors: a.advisors,
      };
    }
    // 默认论文
    return {
      ...base,
      category: "论文",
      title: a.title ?? a.name ?? "",
      venue: a.venue ?? "",
      jcr: a.jcr,
      cas: a.cas,
      correspondingAuthors: a.correspondingAuthors,
    };
  });
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
          const id = `ach-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          set((s) => ({ achievements: [{ ...a, id } as Achievement, ...s.achievements] }));
          schedulePush(`add-achievement: ${a.category}`);
        },
        updateAchievement: (id, patch) => {
          set((s) => ({
            achievements: s.achievements.map((x) => (x.id === id ? ({ ...x, ...patch } as Achievement) : x)),
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
      name: "rising-sun-achievements-v2",
      partialize: (state) => ({
        achievements: state.achievements,
        ghToken: state.ghToken,
        remoteSha: state.remoteSha,
      }),
    }
  )
);