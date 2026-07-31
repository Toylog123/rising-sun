import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ListTodo, Users, Plus, Archive, Download } from "lucide-react";
import { useTaskStore, latestStatus } from "@/store/tasks";
import TaskCard from "@/components/TaskCard";
import { downloadJson, timestamp } from "@/lib/download";

const STATUS_OPTIONS = ["全部", "进行中", "挂起", "已完成", "未开始"];

export default function Tasks() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const members = useTaskStore((s) => s.members);
  const advisor = useTaskStore((s) => s.advisor);
  const [params] = useSearchParams();
  const [member, setMember] = useState(params.get("member") || "全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    // 排除老师（role=teacher）：只让学生出现在成员筛选里
    const studentNames = members
      .filter((m) => m.role !== "teacher")
      .map((m) => m.name);
    const names = Array.from(new Set([...studentNames, ...tasks.flatMap((t) => t.assignees)]));
    return names.sort((a, b) => (a === "多人任务" ? 1 : b === "多人任务" ? -1 : 0));
  }, [tasks, members]);

  const memberChips = ["全部", ...groups];
  const matchQ = (t: (typeof tasks)[number]) =>
    q.trim() === "" ||
    t.title.toLowerCase().includes(q.toLowerCase()) ||
    t.assignees.some((a) => a.includes(q));

  const visible = tasks.filter(
    (t) =>
      (member === "全部" || t.assignees.includes(member)) &&
      (statusFilter === "全部" || latestStatus(t) === statusFilter) &&
      matchQ(t)
  );

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
            <ListTodo size={16} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1a1a1a] leading-none">任务</h1>
            <p className="mt-1 text-sm text-[#6b6560]">共 {visible.length} 项任务</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              downloadJson(`tasks-${timestamp()}.json`, {
                advisor,
                members,
                tasks: allTasks,
              })
            }
            title="导出全部任务 + 成员为 JSON"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#c96442] transition-colors"
          >
            <Download size={14} />
            导出
          </button>
          <Link
            to="/archive"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#1a1a1a] transition-colors"
          >
            <Archive size={15} />
            归档
          </Link>
          <Link
            to="/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
          >
            <Plus size={15} />
            新建任务
          </Link>
        </div>
      </div>

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
          {STATUS_OPTIONS.map((c) => (
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
      ) : (
        <div className="space-y-10">
          {visibleMembers.map((name) => {
            const list = visible.filter((t) => t.assignees.includes(name));
            if (list.length === 0) return null;
            return (
              <div key={name}>
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-[#c96442]" />
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