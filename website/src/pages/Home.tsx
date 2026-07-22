import { Link } from "react-router-dom";
import { ListTodo, Plus, Users, TrendingUp, FlaskConical, GraduationCap } from "lucide-react";
import { useTaskStore, latestStatus, statusTone, latestUpdate } from "@/store/tasks";
import StatusBadge from "@/components/StatusBadge";

export default function Home() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const seedMembers = useTaskStore((s) => s.members);
  const advisor = useTaskStore((s) => s.advisor);

  const members = Array.from(
    new Set([
      ...seedMembers,
      ...tasks.map((t) => t.assignee).filter((a) => a !== "共同任务"),
    ])
  );

  const statOf = (name: string) => {
    const list = tasks.filter((t) => t.assignee === name);
    const done = list.filter((t) => statusTone(latestStatus(t)) === "green").length;
    const hold = list.filter((t) => statusTone(latestStatus(t)) === "red").length;
    const active = list.filter((t) => statusTone(latestStatus(t)) === "amber").length;
    const pct = list.length ? Math.round((done / list.length) * 100) : 0;
    return { total: list.length, done, hold, active, pct };
  };

  const feed = tasks
    .map((t) => ({ t, u: latestUpdate(t) }))
    .filter((x) => x.u)
    .sort((a, b) => (b.u!.date).localeCompare(a.u!.date))
    .slice(0, 6);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => statusTone(latestStatus(t)) === "green").length;

  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf9f5] via-[#f5f0e6] to-[#f0ece4]">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "radial-gradient(circle, #c96442 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#e8e4db] px-3 py-1 text-xs text-[#6b6560] shadow-sm">
                <FlaskConical size={12} className="text-[#c96442]" />
                Rising Sun 课题组 · AI for EDA / ECO
              </div>
              {advisor && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c96442]/10 border border-[#c96442]/20 px-3 py-1 text-xs font-medium text-[#c96442]">
                  <GraduationCap size={13} />
                  指导老师 · {advisor}
                </div>
              )}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-black text-[#1a1a1a] leading-tight tracking-tight">
              Rising Sun
              <span className="block mt-1 text-2xl sm:text-3xl font-light text-[#6b6560] tracking-widest">
                任务管理看板
              </span>
            </h1>
            <p className="mt-5 text-base text-[#4a4540] leading-relaxed max-w-lg">
              按成员追踪课题任务与每期组会的进展情况，共 <strong className="text-[#1a1a1a]">{totalTasks}</strong> 项任务，已完成 <strong className="text-[#1a1a1a]">{doneTasks}</strong> 项。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tasks" className="inline-flex items-center gap-2 rounded-full bg-[#c96442] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#c96442]/20 transition-all hover:bg-[#b5573a] hover:shadow-lg hover:shadow-[#c96442]/30">
                <ListTodo size={16} />
                查看任务看板
              </Link>
              <Link to="/new" className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e8e4db] px-6 py-2.5 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#c96442]/30 hover:shadow-md">
                <Plus size={14} />
                新建任务
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 成员进度概览 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
            <Users size={16} />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">成员进度概览</h2>
            <p className="text-sm text-[#6b6560]">指导老师 {advisor} · 组员 {members.length} 人</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const s = statOf(m);
            return (
              <Link key={m} to={`/tasks?member=${encodeURIComponent(m)}`} className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/20">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-[#1a1a1a]">{m}</span>
                  <span className="text-xs text-[#6b6560]">{s.total} 项任务</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-[#f0ece4] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#c96442] to-[#e08a63] transition-all" style={{ width: `${s.pct}%` }} />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6b6560]">
                  <span className="text-[#c96442] font-semibold">进行中 {s.active}</span>
                  <span>挂起 {s.hold}</span>
                  <span>已完成 {s.done}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 最近进展 */}
      <section className="bg-[#faf9f5] border-t border-[#e8e4db]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
              <TrendingUp size={16} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">最近进展</h2>
          </div>
          <div className="rounded-2xl bg-white border border-[#e8e4db] divide-y divide-[#f0ece4]">
            {feed.map(({ t, u }) => (
              <div key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                <span className="text-xs font-semibold text-[#6b6560] w-24 shrink-0">{u!.date}</span>
                <span className="text-sm font-medium text-[#1a1a1a]">{t.assignee}</span>
                <span className="text-sm text-[#6b6560] flex-1 min-w-[160px]">{t.title}</span>
                <StatusBadge status={u!.status} />
                {u!.note && <span className="text-xs text-[#9a9590] w-full sm:w-auto">（{u!.note}）</span>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
