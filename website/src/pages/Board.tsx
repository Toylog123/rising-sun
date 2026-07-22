import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Plus, X } from "lucide-react";
import { useTaskStore, latestStatus, latestUpdate, statusTone, type Tone } from "@/store/tasks";
import TaskCard from "@/components/TaskCard";

const COLUMNS: { tone: Tone; title: string; color: string; tint: string }[] = [
  { tone: "gray", title: "未开始", color: "#8a8378", tint: "#f3f1ec" },
  { tone: "amber", title: "进行中", color: "#c96442", tint: "#fbf1ec" },
  { tone: "red", title: "挂起", color: "#d9534f", tint: "#fbeeed" },
  { tone: "green", title: "已完成", color: "#3f9e63", tint: "#edf6f0" },
];

export default function Board() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const seedMembers = useTaskStore((s) => s.members);
  const advisor = useTaskStore((s) => s.advisor);
  const [member, setMember] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const names = Array.from(new Set([...seedMembers, ...tasks.map((t) => t.assignee)]));
    return names.sort((a, b) => (a === "共同任务" ? 1 : b === "共同任务" ? -1 : 0));
  }, [tasks, seedMembers]);

  const memberChips = ["全部", ...groups];
  const statusChips = ["全部", ...COLUMNS.map((c) => c.title)];

  const visible = tasks.filter((t) => member === "全部" || t.assignee === member);
  const cols = statusFilter === "全部" ? COLUMNS : COLUMNS.filter((c) => c.title === statusFilter);
  const single = cols.length === 1;
  const selected = allTasks.find((t) => t.id === selectedId) || null;

  const chipCls = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
      active
        ? "bg-[#c96442] text-white shadow-sm"
        : "bg-white border border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#1a1a1a]"
    }`;

  const shownCount = cols.reduce(
    (n, col) => n + visible.filter((t) => statusTone(latestStatus(t)) === col.tone).length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 标题栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#c96442] text-white shadow-sm shadow-[#c96442]/25">
            <LayoutGrid size={17} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1a1a1a] leading-none">任务看板</h1>
            <p className="mt-1 text-xs text-[#9a9590]">指导老师 {advisor} · 显示 {shownCount} 项任务</p>
          </div>
        </div>
        <Link to="/new" className="inline-flex items-center gap-2 rounded-full bg-[#c96442] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#c96442]/20 transition-all hover:bg-[#b5573a] hover:shadow-lg">
          <Plus size={16} /> 新建任务
        </Link>
      </div>

      {/* 筛选工具栏 */}
      <div className="mb-8 rounded-2xl bg-white border border-[#e8e4db] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs font-semibold text-[#9a9590]">状态</span>
          {statusChips.map((c) => (
            <button key={c} onClick={() => setStatusFilter(c)} className={chipCls(statusFilter === c)}>{c}</button>
          ))}
        </div>
        <div className="h-px bg-[#f0ece4]" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs font-semibold text-[#9a9590]">成员</span>
          {memberChips.map((c) => (
            <button key={c} onClick={() => setMember(c)} className={chipCls(member === c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* 看板列 */}
      <div className={`grid gap-4 ${single ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        {cols.map((col) => {
          const list = visible
            .filter((t) => statusTone(latestStatus(t)) === col.tone)
            .sort((a, b) => (latestUpdate(b)?.date || "").localeCompare(latestUpdate(a)?.date || ""));
          return (
            <div key={col.tone} className="rounded-2xl border border-[#e8e4db] overflow-hidden bg-white flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: col.tint }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <span className="text-sm font-bold" style={{ color: col.color }}>{col.title}</span>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#6b6560]">{list.length}</span>
              </div>
              <div className={`p-3 flex-1 ${single ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}`}>
                {list.map((t) => {
                  const u = latestUpdate(t);
                  const initial = t.assignee.slice(-2);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className="group relative w-full text-left rounded-xl bg-white border border-[#e8e4db] p-3.5 pl-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#c96442]/30"
                    >
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full" style={{ background: col.color }} />
                      <p className="font-serif text-sm font-semibold text-[#1a1a1a] leading-snug">{t.title}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#c96442]/10 text-[10px] font-bold text-[#c96442]">{initial}</span>
                        <span className="text-xs text-[#6b6560]">{t.assignee}</span>
                        <span className="ml-auto text-xs text-[#9a9590]">{u?.date}</span>
                      </div>
                      {u?.note && <p className="mt-1.5 text-xs text-[#9a9590] truncate">（{u.note}）</p>}
                    </button>
                  );
                })}
                {list.length === 0 && <p className="px-1.5 py-4 text-center text-xs text-[#c3bcb2]">暂无任务</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 详情抽屉 */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={() => setSelectedId(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#f5f2eb] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[#faf9f5]/90 backdrop-blur border-b border-[#e8e4db] px-5 py-3.5">
              <span className="font-serif text-lg font-bold text-[#1a1a1a]">任务详情</span>
              <button onClick={() => setSelectedId(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b6560] hover:bg-[#f0ece4] hover:text-[#1a1a1a] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <TaskCard task={selected} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
