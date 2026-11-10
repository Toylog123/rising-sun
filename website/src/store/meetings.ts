import { create } from "zustand";
import { persist } from "zustand/middleware";
import seed from "@/data/meetings.json";
import { fetchMeetings, pushMeetings, GitHubApiError, deleteFile, fetchFileSha } from "@/lib/github";
import { sleep } from "@/lib/uploads";
import { registerTokenStore, resolveInitialToken } from "@/lib/auth";
import { mergeMeetings as mergeMeetingsRaw, mergeSeedAndStored } from "@/lib/merge";
import type { MeetingAttachment } from "@/lib/uploads";

export interface Meeting {
  id: string;          // 如 "m-2026-07-20"
  date: string;        // YYYY-MM-DD
  speaker: string;     // 主讲人（学生名 或 老师）
  topic: string;       // 议题/标题
  notes?: string;      // 纪要
  attachments?: MeetingAttachment[];  // 汇报材料（PDF 等）
  updatedAt?: string;  // ISO 时间戳，冲突合并时判断谁更新
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
  /** 删除一条组会时，顺带清掉它在仓库里的附件文件 */
  removeMeetingFiles: (id: string) => Promise<void>;
  /** 删除若干附件在仓库里的实体文件（记录里的引用已去掉后调用） */
  deleteAttachmentFiles: (files: MeetingAttachment[]) => Promise<void>;
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
    attachments: Array.isArray(m.attachments)
      ? m.attachments
          .filter((a) => a && typeof a.path === "string" && a.path)
          .map((a) => ({
            name: a.name ?? "附件",
            path: a.path,
            size: a.size ?? 0,
            sha: a.sha,
            uploadedAt: a.uploadedAt ?? new Date().toISOString(),
          }))
      : undefined,
    updatedAt: m.updatedAt,
  }));
}

/**
 * 合并本地与远端的组会记录。
 *
 * 组会 JSON 是多人共用的，朴素的「拉取即覆盖」会把别人刚提交的记录冲掉，
 * 也会把本机刚传好附件、还没推送成功的改动弄丢。规则见 lib/merge.ts。
 */
const mergeMeetings = mergeMeetingsRaw;

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
          set({ syncStatus: "pushing", syncError: null });
          let sha = state.remoteSha;
          let snapshot = state.meetings;
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              // 没有 remoteSha（首次使用、还没拉过远端）时，先取一次远端
              // 拿到 sha，合并后再推，避免用户第一次保存就报「缺少文件 SHA」
              if (!sha) {
                const fresh = await fetchMeetings(get().ghToken);
                snapshot = mergeMeetings(snapshot, normalizeMeetings(fresh.data.meetings));
                sha = fresh.sha;
                set({ meetings: snapshot, remoteSha: fresh.sha });
              }
              const newSha = await pushMeetings({ meetings: snapshot }, sha, state.ghToken, message);
              set({ remoteSha: newSha, syncStatus: "ready", lastSyncedAt: Date.now(), syncError: null });
              return;
            } catch (err) {
              if (err instanceof GitHubApiError && err.status === 409 && attempt < maxAttempts) {
                // 远端已有人提交：先合并再重推，不能直接用远端覆盖本地
                const fresh = await fetchMeetings(get().ghToken);
                snapshot = mergeMeetings(snapshot, normalizeMeetings(fresh.data.meetings));
                set({ meetings: snapshot, remoteSha: fresh.sha });
                // 用合并后的快照重试，否则重推的还是旧快照，会把协作者的修改覆盖掉
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
          const { data, sha } = await fetchMeetings(get().ghToken);
          // 合并而不是覆盖：本地还没推送成功的改动不能被拉取冲掉
          const merged = mergeMeetings(get().meetings, normalizeMeetings(data.meetings));
          set({
            meetings: merged,
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
          set((s) => ({
            meetings: [{ ...m, id, updatedAt: new Date().toISOString() }, ...s.meetings],
          }));
          schedulePush(`add-meeting: ${m.topic || m.date}`);
        },
        updateMeeting: (id, patch) => {
          set((s) => ({
            meetings: s.meetings.map((x) =>
              x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x
            ),
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
        removeMeetingFiles: async (id) => {
          const m = get().meetings.find((x) => x.id === id);
          if (!m?.attachments?.length) return;
          await get().deleteAttachmentFiles(m.attachments);
        },
        deleteAttachmentFiles: async (files) => {
          const token = get().ghToken;
          if (!token || !files.length) return;
          for (const a of files) {
            try {
              // 老记录可能没存 sha（早期上传时没回写），这时现查一次
              const sha = a.sha ?? (await fetchFileSha(a.path, token));
              if (!sha) continue;
              await deleteFile(a.path, sha, token, `chore: 删除组会附件 ${a.name}`);
            } catch {
              // 附件删除失败不影响主流程（数据记录已经更新）
            }
            // 官方建议相邻两次 mutative 请求之间至少隔 1 秒，避免二级限速
            await sleep(1000);
          }
        },
      };
    },
    {
      name: "rising-sun-meetings-v1",
      partialize: (state) => ({
        meetings: state.meetings,
        ghToken: state.ghToken,
        remoteSha: state.remoteSha,
      }),
      // 关键：不要用旧缓存整体覆盖状态，而是把缓存里的记录与仓库种子合并。
      // 老用户缓存里存的是最早的空数组，直接覆盖会让组会页一直是空的。
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MeetingState>;
        const storedMeetings = Array.isArray(p.meetings) ? (p.meetings as Meeting[]) : [];
        return {
          ...current,
          ...p,
          meetings: mergeSeedAndStored(storedMeetings, seedMeetings),
        };
      },
      onRehydrateStorage: () => (state) => {
        // 老用户的 token 可能只存在于 tasks store，这里补齐
        if (state) {
          const t = resolveInitialToken(state.ghToken);
          if (t && t !== state.ghToken) state.setToken(t);
        }
      },
    }
  )
);

// 让共享 PAT 能同步到这个 store
registerTokenStore(useMeetingStore);