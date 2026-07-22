import { useMemo } from "react";
import { Archive as ArchiveIcon, CheckCheck } from "lucide-react";
import { useTaskStore, statusTone, latestStatus } from "@/store/tasks";
import TaskCard from "@/components/TaskCard";

export default function Archive() {
  const tasks = useTaskStore((s) => s.tasks);
  const archiveCompleted = useTaskStore((s) => s.archiveCompleted);

  const archived = tasks.filter((t) => t.archived);
  const doneActive = tasks.filter(
    (t) => !t.archived && statusTone(latestStatus(t)) === "green"
  ).length;

  const groups = useMemo(
    () => Array.from(new Set(archived.map((t) => t.assignee))),
    [archived]
  );

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
          <p className="text-[#6b6560] ml-11">已归档 {archived.length} 项 · 不再显示在活跃看板</p>
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

      {archived.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6560]">
          <ArchiveIcon size={40} className="mb-4 opacity-20" />
          <p className="text-base">暂无归档任务</p>
          <p className="mt-1 text-sm text-[#9a9590]">在任务卡片点「归档」即可收起已完成的任务</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((name) => {
            const list = archived.filter((t) => t.assignee === name);
            return (
              <div key={name}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">{name}</h2>
                  <span className="rounded-full bg-[#f0ece4] px-2 py-0.5 text-xs text-[#6b6560]">
                    {list.length} 项
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.map((t) => (
                    <TaskCard key={t.id} task={t} />
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
