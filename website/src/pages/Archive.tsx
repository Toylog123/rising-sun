import { useMemo, useState } from "react";
import { Archive as ArchiveIcon, CheckCheck, Trash2, RotateCcw } from "lucide-react";
import { useTaskStore, statusTone, latestStatus, type Task } from "@/store/tasks";

type TabKey = "all" | "completed" | "removed";

const TABS: { key: TabKey; label: string; predicate: (t: Task) => boolean }[] = [
  { key: "all", label: "全部", predicate: () => true },
  { key: "completed", label: "已完成", predicate: (t) => t.archived && latestStatus(t).includes("完成") },
  { key: "removed", label: "已删除", predicate: (t) => Boolean(t.removedAt) },
];

export default function Archive() {
  const tasks = useTaskStore((s) => s.tasks);
  const archiveCompleted = useTaskStore((s) => s.archiveCompleted);
  const removeTask = useTaskStore((s) => s.removeTask);
  const setArchived = useTaskStore((s) => s.setArchived);

  const [tab, setTab] = useState<TabKey>("all");

  const archived = useMemo(() => tasks.filter((t) => t.archived), [tasks]);

  const current = useMemo(() => {
    const def = TABS.find((x) => x.key === tab)!;
    return archived.filter(def.predicate);
  }, [archived, tab]);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((x) => [x.key, archived.filter(x.predicate).length])) as Record<TabKey, number>,
    [archived]
  );

  const doneActive = tasks.filter(
    (t) => !t.archived && statusTone(latestStatus(t)) === "green"
  ).length;

  const groups = useMemo(
    () =>
      Array.from(
        new Set(
          [...current]
            .sort((a, b) => (b.removedAt || "").localeCompare(a.removedAt || ""))
            .map((t) => t.assignee)
        )
      ),
    [current]
  );

  const handlePermanentRemove = (t: Task) => {
    const msg =
      `确定永久删除「${t.title}」？\n\n` +
      `该操作不可撤销：任务数据将从仓库的 tasks.json 中彻底删除。`;
    if (!confirm(msg)) return;
    if (!confirm("再次确认：真的要永久删除吗？")) return;
    removeTask(t.id);
  };

  const handleRestore = (t: Task) => {
    setArchived(t.id, false);
  };

  const tabCls = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
      active
        ? "bg-[#6b6560] text-white shadow-sm"
        : "bg-white border border-[#e8e4db] text-[#6b6560] hover:border-[#6b6560]/40 hover:text-[#1a1a1a]"
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#6b6560] text-white">
              <ArchiveIcon size={16} />
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">归档</h1>
          </div>
          <p className="text-[#6b6560] ml-11">已归档 {archived.length} 项 · 删除任务会归档在此，可恢复或永久删除</p>
        </div>
        {doneActive > 0 && (
          <button
            onClick={archiveCompleted}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c96442] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
          >
            <CheckCheck size={16} />
            归档全部已完成（{doneActive}）
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={tabCls(tab === t.key)}>
            {t.label} <span className="ml-1 text-xs opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6560]">
          <ArchiveIcon size={40} className="mb-4 opacity-20" />
          <p className="text-base">
            {tab === "removed" ? "暂无已删除任务" : tab === "completed" ? "暂无已完成归档" : "暂无归档任务"}
          </p>
          <p className="mt-1 text-sm text-[#9a9590]">在任务卡片点「归档」收起任务，或点「删除」归档到此处</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((name) => {
            const list = current.filter((t) => t.assignee === name);
            if (list.length === 0) return null;
            return (
              <div key={name}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">{name}</h2>
                  <span className="rounded-full bg-[#f0ece4] px-2 py-0.5 text-xs text-[#6b6560]">{list.length} 项</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.map((t) => (
                    <div key={t.id} className="relative">
                      {t.removedAt && (
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">
                          <Trash2 size={12} /> 已删除于 {t.removedAt}
                        </div>
                      )}
                      <div className="rounded-2xl bg-white border border-dashed border-[#d5d0c8] p-5 opacity-90">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-serif text-base font-semibold leading-snug text-[#1a1a1a]">{t.title}</h3>
                          <span className="rounded-md bg-[#f0ece4] px-2 py-0.5 text-xs text-[#6b6560] whitespace-nowrap">
                            {latestStatus(t)}
                          </span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b6560]">
                          <span>创建 {t.createdAt}</span>
                          <span>{t.updates.length} 次进展</span>
                          {t.advisor && <span>导师：{t.advisor}</span>}
                        </div>
                        <div className="mt-3 flex items-center gap-3 border-t border-[#f0ece4] pt-3">
                          <button
                            onClick={() => handleRestore(t)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#c96442] hover:text-[#b5573a] transition-colors"
                          >
                            <RotateCcw size={13} /> 恢复
                          </button>
                          <button
                            onClick={() => handlePermanentRemove(t)}
                            className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={13} /> 永久删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}