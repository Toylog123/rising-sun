import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, TrendingUp, FlaskConical, GraduationCap, Cpu, Sparkles, BookOpen,
  AlertCircle, RefreshCw, CloudOff, Calendar, ArrowRight,
} from "lucide-react";
import { useTaskStore, latestStatus, statusTone, latestUpdate } from "@/store/tasks";
import { timeAgo } from "@/lib/github";
import StatusBadge from "@/components/StatusBadge";

const DIRECTIONS = [
  {
    icon: Cpu,
    title: "芯片设计自动化",
    desc: "聚焦物理设计、布局布线、时序分析等关键环节，用算法和机器学习替代传统人工迭代，缩短设计周期、提升芯片性能与良率。",
  },
  {
    icon: Sparkles,
    title: "AI for EDA",
    desc: "将大模型、强化学习、图神经网络等前沿 AI 技术应用于 EDA 工具链，探索智能布图、跨层优化、可解释性分析等新范式。",
  },
  {
    icon: FlaskConical,
    title: "工程变更优化（ECO）",
    desc: "面向设计后期的工程变更场景，研究高效、低代价的 ECO 求解方法，自动化修复时序、功耗、拥塞违例，加速流片进程。",
  },
];

export default function Home() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const storeMembers = useTaskStore((s) => s.members);
  const advisor = useTaskStore((s) => s.advisor);
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const syncError = useTaskStore((s) => s.syncError);
  const lastSyncedAt = useTaskStore((s) => s.lastSyncedAt);
  const ghToken = useTaskStore((s) => s.ghToken);
  const pull = useTaskStore((s) => s.pull);

  useEffect(() => {
    if (syncStatus === "idle") pull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const members = Array.from(
    new Set([
      ...storeMembers.map((m) => m.name),
      ...tasks.flatMap((t) => t.assignees).filter((a) => a !== "多人任务"),
    ])
  );

  const statOf = (name: string) => {
    const list = tasks.filter((t) => t.assignees.includes(name));
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
      {/* 同步状态横幅 */}
      {syncStatus === "pulling" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-xs text-amber-800">
            <RefreshCw size={13} className="animate-spin shrink-0" />
            <span>正在拉取最新任务数据…</span>
          </div>
        </div>
      )}
      {syncStatus === "error" && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={13} className="shrink-0" />
            <span className="flex-1">同步失败：{syncError}</span>
            <button onClick={() => pull()} className="font-medium underline hover:no-underline">重试</button>
          </div>
        </div>
      )}
      {!ghToken && syncStatus === "ready" && (
        <div className="bg-[#faf9f5] border-b border-[#e8e4db]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-xs text-[#6b6560]">
            <CloudOff size={13} className="shrink-0" />
            <span className="flex-1">未配置 PAT，目前为只读浏览 · 数据 {timeAgo(lastSyncedAt)} 拉取</span>
            <Link to="/tasks" className="font-medium text-[#c96442] hover:underline">前往设置 →</Link>
          </div>
        </div>
      )}

      {/* Hero 宣传区 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf9f5] via-[#f5f0e6] to-[#f0ece4]">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "radial-gradient(circle, #c96442 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#e8e4db] px-3 py-1 text-xs text-[#6b6560] shadow-sm">
                <FlaskConical size={12} className="text-[#c96442]" />
                芯片设计自动化 · EDA
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c96442]/10 border border-[#c96442]/20 px-3 py-1 text-xs font-medium text-[#c96442]">
                <Sparkles size={12} />
                成立于 2025
              </div>
              {advisor && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c96442]/10 border border-[#c96442]/20 px-3 py-1 text-xs font-medium text-[#c96442]">
                  <GraduationCap size={13} />
                  指导老师 · {advisor}
                </div>
              )}
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl font-black text-[#1a1a1a] leading-tight tracking-tight">
              Rising Sun
              <span className="block mt-2 text-xl sm:text-2xl font-light text-[#6b6560] tracking-widest">
                芯片设计自动化课题组
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-[#4a4540] leading-relaxed max-w-2xl">
              我们是一个年轻的课题组，成立于 2025 年，专注于<strong className="text-[#1a1a1a] font-semibold">芯片设计自动化（EDA）</strong>方向。
              围绕物理设计、布局布线、工程变更优化（ECO）等关键环节，结合机器学习与运筹优化方法，
              探索更智能、更高效的 EDA 算法与工具。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/students" className="inline-flex items-center gap-2 rounded-full bg-[#c96442] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#c96442]/20 transition-all hover:bg-[#b5573a] hover:shadow-lg hover:shadow-[#c96442]/30">
                <Users size={16} />
                了解组员
                <ArrowRight size={14} />
              </Link>
              <Link to="/meetings" className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e8e4db] px-6 py-2.5 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#c96442]/30 hover:shadow-md">
                <Calendar size={16} />
                组会记录
              </Link>
              <Link to="/tasks" className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e8e4db] px-6 py-2.5 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#c96442]/30 hover:shadow-md">
                <BookOpen size={16} />
                研究进展
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 研究方向 */}
      <section className="bg-[#faf9f5] border-t border-[#e8e4db]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e8e4db] px-3 py-1 text-xs text-[#6b6560] mb-3 shadow-sm">
              <FlaskConical size={12} className="text-[#c96442]" />
              研究方向
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#1a1a1a]">我们在做什么</h2>
            <p className="mt-3 text-sm text-[#6b6560] max-w-2xl mx-auto">
              从算法到工具，从理论到工程 —— 我们围绕芯片设计自动化的关键难题展开研究。
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {DIRECTIONS.map((d) => {
              const Icon = d.icon;
              return (
                <article
                  key={d.title}
                  className="rounded-2xl bg-white border border-[#e8e4db] p-6 transition-all hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/30"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#c96442]/10 text-[#c96442] mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">{d.title}</h3>
                  <p className="mt-2 text-sm text-[#4a4540] leading-relaxed">{d.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 成员进度概览 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
            <Users size={16} />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">成员进度概览</h2>
            <p className="text-sm text-[#6b6560]">指导老师 {advisor} · 组员 {members.length} 人</p>
          </div>
          <Link
            to="/students"
            className="ml-auto inline-flex items-center gap-1 text-sm text-[#c96442] hover:text-[#b5573a] transition-colors"
          >
            查看全部
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const s = statOf(m);
            return (
              <Link
                key={m}
                to="/gallery"
                className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-[#1a1a1a]">{m}</span>
                  <span className="text-xs text-[#6b6560]">{s.total} 项任务</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-[#f0ece4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c96442] to-[#e08a63] transition-all"
                    style={{ width: `${s.pct}%` }}
                  />
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
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {t.assignees.length === 1 ? t.assignees[0] : `${t.assignees.slice(0, 2).join("、")}${t.assignees.length > 2 ? " 等" : ""}`}
                </span>
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