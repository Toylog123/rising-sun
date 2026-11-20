import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ListTodo, Users, Plus, Archive, Download } from "lucide-react";
import { useTaskStore, latestStatus } from "@/store/tasks";
import TaskCard from "@/components/TaskCard";
import { downloadText, timestamp, tasksToMarkdown } from "@/lib/download";

const STATUS_OPTIONS = ["全部", "进行中", "挂起", "已完成", "未开始"];

export default function Tasks() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const members = useTaskStore((s) => s.members);
  const advisor = useTaskStore((s) => s.advisor);
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const pullNow = useTaskStore((s) => s.pullNow);
  const [params] = useSearchParams();
  const [member, setMember] = useState(params.get("member") || "全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [q, setQ] = useState("");

  // 进页面自动拉一次远端（首页之外直接进本页也能拿到最新任务）
  useEffect(() => {
    if (syncStatus === "idle") void pullNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const chipCls = (active: boolean) => `chip ${active ? "chip-active" : "chip-idle"}`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-control bg-gradient-to-br from-accent to-accent-deep text-white shadow-brand shadow-hairline ring-1 ring-inset ring-white/15">
            <ListTodo size={22} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold leading-none tracking-heading text-ink">任务</h1>
            <p className="mt-2 text-sm text-muted">共 {visible.length} 项任务 · 按成员分组查看进展</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              downloadText(
                `tasks-${timestamp()}.md`,
                tasksToMarkdown({
                  advisor,
                  members,
                  tasks: allTasks,
                })
              )
            }
            title="导出全部任务 + 成员为 Markdown（可直接阅读）"
            className="btn-secondary !px-3 !py-2"
          >
            <Download size={14} />
            导出
          </button>
          <Link to="/archive" className="btn-secondary !px-3 !py-2">
            <Archive size={15} />
            归档
          </Link>
          <Link to="/new" className="btn-primary">
            <Plus size={15} />
            新建任务
          </Link>
        </div>
      </div>

      <div className="surface mb-8 space-y-3.5 p-4 shadow-soft sm:p-5">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索任务标题或负责人..."
            className="field w-full !py-2.5 !pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs font-semibold text-faint">状态</span>
          {STATUS_OPTIONS.map((c) => (
            <button key={c} onClick={() => setStatusFilter(c)} className={chipCls(statusFilter === c)}>{c}</button>
          ))}
        </div>
        <div className="h-px bg-wash" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs font-semibold text-faint">成员</span>
          {memberChips.map((c) => (
            <button key={c} onClick={() => setMember(c)} className={chipCls(member === c)}>{c}</button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
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
                  <Users size={18} className="text-accent" />
                  <h2 className="font-serif text-xl font-bold text-ink">{name}</h2>
                  <span className="rounded-full bg-wash px-2 py-0.5 text-xs text-muted">{list.length} 项</span>
                </div>
                {/* items-start：网格默认会把卡片拉伸到整行高度，
                    一张展开时间线会把同行的另一张也拉高，看着像一起展开了 */}
                <div className="grid gap-4 md:grid-cols-2 items-start">
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