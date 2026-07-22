import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, Rows3, User } from "lucide-react";
import { useTaskStore, latestStatus, latestUpdate, statusTone, type Tone } from "@/store/tasks";
import TaskCard from "@/components/TaskCard";

const COLUMNS: { tone: Tone; title: string; dot: string; head: string }[] = [
  { tone: "gray", title: "未开始", dot: "bg-[#9a9590]", head: "text-[#6b6560]" },
  { tone: "amber", title: "进行中", dot: "bg-[#c96442]", head: "text-[#c96442]" },
  { tone: "red", title: "挂起", dot: "bg-red-500", head: "text-red-600" },
  { tone: "green", title: "已完成", dot: "bg-green-500", head: "text-green-700" },
];

export default function Tasks() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const seedMembers = useTaskStore((s) => s.members);
  const [params] = useSearchParams();
  const [view, setView] = useState<"board" | "list">("board");
  const [member, setMember] = useState(params.get("member") || "全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const names = Array.from(new Set([...seedMembers, ...tasks.map((t) => t.assignee)]));
    return names.sort((a, b) => (a === "共同任务" ? 1 : b === "共同任务" ? -1 : 0));
  }, [tasks, seedMembers]);

  const memberChips = ["全部", ...groups];
  const statusChips = ["全部", ...COLUMNS.map((c) => c.title)];

  const colTitle = (t: (typeof tasks)[number]) =>
    COLUMNS.find((c) => c.tone === statusTone(latestStatus(t)))?.title || "未开始";
  const matchQ = (t: (typeof tasks)[number]) =>
    q.trim() === "" || t.title.toLowerCase().includes(q.toLowerCase()) || t.assignee.includes(q);

  const visible = tasks.filter(
    (t) =>
      (member === "全部" || t.assignee === member) &&
      (statusFilter === "全部" || colTitle(t) === statusFilter) &&
      matchQ(t)
  );

  const cols = statusFilter === "全部" ? COLUMNS : COLUMNS.filter((c) => c.title === statusFilter);
  const single = cols.length === 1;
  const visibleMembers = member === "全部" ? groups : [member];

  const chipCls = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
      active
        ? "bg-[#c96442] text-white shadow-sm"
        : "bg-white border border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#1a1a1a]"
    }`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
            <LayoutGrid size={16} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1a1a1a] leading-none">任务看板</h1>
            <p className="mt-1 text-sm text-[#6b6560]">共 {visible.length} 项任务</p>
          </div>
        </div>
        {/* 视图切换 */}
        <div className="inline-flex rounded-full border border-[#e8e4db] bg-white p-1">
          <button
            onClick={() => setView("board")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${view === "board" ? "bg-[#c96442] text-white shadow-sm" : "text-[#6b6560] hover:text-[#1a1a1a]"}`}
          >
            <LayoutGrid size={15} /> 看板
          </button>
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${view === "list" ? "bg-[#c96442] text-white shadow-sm" : "text-[#6b6560] hover:text-[#1a1a1a]"}`}
          >
            <Rows3 size={15} /> 列表
          </button>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="mb-8 rounded-2xl bg-white border border-[#e8e4db] p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9590]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索任务标题或负责人..."
            className="w-full rounded-xl border border-[#e8e4db] bg-[#faf9f5] py-2.5 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
          />
        </div>
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

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6560]">
          <Search size={40} className="mb-4 opacity-20" />
          <p className="text-base">没有匹配的任务</p>
        </div>
      ) : view === "board" ? (
        /* ===== 看板视图 ===== */
        <div className={`grid gap-4 ${single ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
          {cols.map((col) => {
            const list = visible
              .filter((t) => statusTone(latestStatus(t)) === col.tone)
              .sort((a, b) => (latestUpdate(b)?.date || "").localeCompare(latestUpdate(a)?.date || ""));
            return (
              <div key={col.tone} className="rounded-2xl bg-[#faf9f5] border border-[#e8e4db] p-3">
                <div className="flex items-center gap-2 px-1.5 py-2 mb-1">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-semibold ${col.head}`}>{col.title}</span>
                  <span className="ml-auto rounded-full bg-white border border-[#e8e4db] px-2 py-0.5 text-xs text-[#6b6560]">{list.length}</span>
                </div>
                <div className={single ? "grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 min-h-[40px]" : "space-y-2.5 min-h-[40px]"}>
                  {list.map((t) => {
                    const u = latestUpdate(t);
                    return (
                      <div key={t.id} className="rounded-xl bg-white border border-[#e8e4db] p-3.5 shadow-sm transition-all hover:shadow-md hover:border-[#c96442]/25">
                        <p className="font-serif text-sm font-semibold text-[#1a1a1a] leading-snug">{t.title}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-[#6b6560]">
                          <span className="inline-flex items-center gap-1"><User size={12} className="text-[#c96442]" />{t.assignee}</span>
                          <span>{u?.date}</span>
                        </div>
                        {u?.note && <p className="mt-1 text-xs text-[#9a9590]">（{u.note}）</p>}
                      </div>
                    );
                  })}
                  {list.length === 0 && <p className="px-1.5 py-3 text-xs text-[#c3bcb2]">暂无任务</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== 列表视图（按人 + 可加进展） ===== */
        <div className="space-y-10">
          {visibleMembers.map((name) => {
            const list = visible.filter((t) => t.assignee === name);
            if (list.length === 0) return null;
            return (
              <div key={name}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">{name}</h2>
                  <span className="rounded-full bg-[#f0ece4] px-2 py-0.5 text-xs text-[#6b6560]">{list.length} 项</span>
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
