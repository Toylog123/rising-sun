import { useState, useMemo } from "react";
import { LayoutGrid, User } from "lucide-react";
import { useTaskStore, latestStatus, latestUpdate, statusTone, type Tone } from "@/store/tasks";

const COLUMNS: { tone: Tone; title: string; dot: string; head: string }[] = [
  { tone: "gray", title: "未开始", dot: "bg-[#9a9590]", head: "text-[#6b6560]" },
  { tone: "amber", title: "进行中", dot: "bg-[#c96442]", head: "text-[#c96442]" },
  { tone: "red", title: "挂起", dot: "bg-red-500", head: "text-red-600" },
  { tone: "green", title: "已完成", dot: "bg-green-500", head: "text-green-700" },
];

export default function Board() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const seedMembers = useTaskStore((s) => s.members);
  const [member, setMember] = useState("全部");

  const groups = useMemo(() => {
    const names = Array.from(new Set([...seedMembers, ...tasks.map((t) => t.assignee)]));
    return names.sort((a, b) => (a === "共同任务" ? 1 : b === "共同任务" ? -1 : 0));
  }, [tasks, seedMembers]);
  const chips = ["全部", ...groups];

  const visible = tasks.filter((t) => member === "全部" || t.assignee === member);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
            <LayoutGrid size={16} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">总任务看板</h1>
        </div>
        <p className="text-[#6b6560] ml-11">全组任务按状态汇总 · 共 {visible.length} 项</p>
      </div>

      {/* 成员筛选 */}
      <div className="mb-8 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setMember(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              member === c
                ? "bg-[#c96442] text-white shadow-sm"
                : "bg-white border border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/30 hover:text-[#1a1a1a]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 看板列 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const list = visible
            .filter((t) => statusTone(latestStatus(t)) === col.tone)
            .sort((a, b) => (latestUpdate(b)?.date || "").localeCompare(latestUpdate(a)?.date || ""));
          return (
            <div key={col.tone} className="rounded-2xl bg-[#faf9f5] border border-[#e8e4db] p-3">
              <div className="flex items-center gap-2 px-1.5 py-2 mb-1">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className={`text-sm font-semibold ${col.head}`}>{col.title}</span>
                <span className="ml-auto rounded-full bg-white border border-[#e8e4db] px-2 py-0.5 text-xs text-[#6b6560]">
                  {list.length}
                </span>
              </div>
              <div className="space-y-2.5 min-h-[40px]">
                {list.map((t) => {
                  const u = latestUpdate(t);
                  return (
                    <div key={t.id} className="rounded-xl bg-white border border-[#e8e4db] p-3.5 shadow-sm transition-all hover:shadow-md hover:border-[#c96442]/25">
                      <p className="font-serif text-sm font-semibold text-[#1a1a1a] leading-snug">{t.title}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#6b6560]">
                        <span className="inline-flex items-center gap-1">
                          <User size={12} className="text-[#c96442]" />
                          {t.assignee}
                        </span>
                        <span>{u?.date}</span>
                      </div>
                      {u?.note && <p className="mt-1 text-xs text-[#9a9590]">（{u.note}）</p>}
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <p className="px-1.5 py-3 text-xs text-[#c3bcb2]">暂无任务</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
