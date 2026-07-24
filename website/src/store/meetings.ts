import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/meetings.json";
import { fetchMeetings, pushMeetings, GitHubApiError } from "@/lib/github";

export interface Meeting {
  id: string;          // 如 "m-2026-07-20"
  date: string;        // YYYY-MM-DD
  speaker: string;     // 主讲人（学生名 或 老师）
  topic: string;       // 议题/标题
  notes?: string;      // 纪要
  decisions?: string;  // 决议
}

export type SyncStatus = "idle" | "pulling" | "pushing" | "error" | "ready";

interface MeetingState {
  meetings: Meeting[];

  // 同步
  ghToken: string;
  remoteSha: string;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  syncError: string | null;

  // mutator
  addMeeting: (m: Omit<Meeting, "id">) => void;
  updateMeeting: (id: string, patch: Partial<Omit<Meeting, "id">>) => void;
  removeMeeting: (id: string) => void;
  pull: () => Promise<void>;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const seedMeetings = (seed.meetings as Meeting[]) ?? [];

function normalizeMeetings(raw: unknown): Meeting[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Partial<Meeting>>).map((m) => ({
    id: m.id ?? `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: m.date ?? new Date().toISOString().slice(0, 10),
    speaker: m.speaker ?? "",
    topic: m.topic ?? "",
    notes: m.notes,
    decisions: m.decisions,
  }));
}

export const useMeetingStore = create<MeetingState>()(
  persist(
    (set, get) => {
      // 闭包状态
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
              const newSha = await pushMeetings({ meetings: state.meetings }, sha, state.ghToken, message);
              set({ remoteSha: newSha, syncStatus: "ready", lastSyncedAt: Date.now(), syncError: null });
              return;
            } catch (err) {
              if (err instanceof GitHubApiError && err.status === 409 && attempt < maxAttempts) {
                const fresh = await fetchMeetings();
                set({ meetings: normalizeMeetings(fresh.data.meetings), remoteSha: fresh.sha });
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
          const { data, sha } = await fetchMeetings();
          set({
            meetings: normalizeMeetings(data.meetings),
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
        meetings: seedMeetings,
        ghToken: "",
        remoteSha: "",
        syncStatus: "idle",
        lastSyncedAt: null,
        syncError: null,

        addMeeting: (m) => {
          const id = `m-${m.date}-${Math.floor(Math.random() * 1000)}`;
          set((s) => ({ meetings: [{ ...m, id }, ...s.meetings] }));
          schedulePush(`add-meeting: ${m.topic || m.date}`);
        },
        updateMeeting: (id, patch) => {
          set((s) => ({
            meetings: s.meetings.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          }));
          schedulePush(`update-meeting: ${id}`);
        },
        removeMeeting: (id) => {
          set((s) => ({ meetings: s.meetings.filter((x) => x.id !== id) }));
          schedulePush(`remove-meeting: ${id}`);
        },

        pull: () => pullInner(),
        setToken: (token) => set({ ghToken: token.trim() }),
        clearToken: () => set({ ghToken: "", remoteSha: "", syncStatus: "idle", syncError: null }),
      };
    },
    {
      name: "rising-sun-meetings-v1",
      partialize: (state) => ({
        meetings: state.meetings,
        ghToken: state.ghToken,
        remoteSha: state.remoteSha,
      }),
    }
  )
);