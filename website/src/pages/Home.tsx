import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, TrendingUp, FlaskConical, GraduationCap, Cpu, Sparkles, BookOpen,
  AlertCircle, RefreshCw, CloudOff, Calendar, ArrowRight,
} from "lucide-react";
import { useTaskStore, latestStatus, statusTone, latestUpdate } from "@/store/tasks";
import { timeAgo } from "@/lib/github";
import StatusBadge from "@/components/StatusBadge";
import HeroLogo from "@/components/HeroLogo";

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
      ...storeMembers.filter((m) => m.role !== "teacher").map((m) => m.name),
      ...tasks.flatMap((t) => t.assignees).filter((a) => a !== "多人任务"),
    ])
  );

  const statOf = (name: string) => {
    const list = tasks.filter((t) => t.assignees.includes(name));
    const done = list.filter((t) => statusTone(latestStatus(t)) === "green").length;
    const hold = list.filter((t) => statusTone(latestStatus(t)) === "red").length;
    const active = list.filter((t) => statusTone(latestStatus(t)) === "amber").length;
    return { total: list.length, done, hold, active };
  };

  const pctOf = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

  const feed = tasks
    .map((t) => ({ t, u: latestUpdate(t) }))
    .filter((x) => x.u)
    .sort((a, b) => (b.u!.date).localeCompare(a.u!.date))
    .slice(0, 6);

  return (
    <div className="font-sans">
      {/* 同步状态横幅 */}
      {syncStatus === "pulling" && (
        <div className="border-b border-warning-line bg-warning-wash">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 text-xs text-warning-ink sm:px-6 lg:px-8">
            <RefreshCw size={13} className="shrink-0 animate-spin" />
            <span>正在拉取最新任务数据…</span>
          </div>
        </div>
      )}
      {syncStatus === "error" && (
        <div className="border-b border-danger-line bg-danger-wash">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 text-xs text-danger-ink sm:px-6 lg:px-8">
            <AlertCircle size={13} className="shrink-0" />
            <span className="flex-1">同步失败：{syncError}</span>
            <button onClick={() => pull()} className="font-medium underline hover:no-underline">重试</button>
          </div>
        </div>
      )}
      {!ghToken && syncStatus === "ready" && (
        <div className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 text-xs text-muted sm:px-6 lg:px-8">
            <CloudOff size={13} className="shrink-0" />
            <span className="flex-1">未配置 PAT，目前为只读浏览 · 数据 {timeAgo(lastSyncedAt)} 拉取</span>
            <Link to="/tasks" className="font-medium text-accent hover:underline">前往设置 →</Link>
          </div>
        </div>
      )}

      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-paper via-wash to-wash">
        <div className="paper-grain pointer-events-none absolute inset-0 opacity-[0.05]" />
        {/* 顶部赤陶装饰线：一条渐隐的品牌色细线，强化页面的编辑气质 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent/60 to-transparent" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-accent/[0.09] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-warning-wash/70 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="max-w-3xl">
            <div className="rise-in mb-8 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ animationDelay: "40ms" }}>
              <span className="eyebrow !border-accent/25 !bg-accent/[0.06] !text-accent-deep"><FlaskConical size={12} className="text-accent" />芯片设计自动化 · EDA</span>
              <span className="flex items-center gap-3.5 text-[13px] text-muted">
                <span className="inline-flex items-center gap-1.5"><Sparkles size={12} className="text-accent/70" />成立于 2025</span>
                {advisor && (
                  <span className="inline-flex items-center gap-1.5"><GraduationCap size={13} className="text-accent/70" />指导老师 · {advisor}</span>
                )}
              </span>
            </div>
            <h1 className="rise-in font-serif text-5xl font-black leading-[1.12] tracking-heading text-ink sm:text-[4.5rem]" style={{ animationDelay: "100ms" }}>
              Rising Sun
              <span className="mt-3.5 block text-lg font-medium tracking-wider2 text-muted sm:text-xl">
                芯片设计自动化课题组
              </span>
            </h1>
            {/* 编辑式分隔线：左右镜像对称，两侧细线由外向内渐深，中间点缀圆点 */}
            <div className="rise-in mt-8 flex items-center gap-3" style={{ animationDelay: "160ms" }}>
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-accent/60" />
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-accent/60" />
            </div>
            <p className="rise-in mt-7 max-w-[34rem] text-[15px] leading-[1.85] text-body-strong sm:text-base" style={{ animationDelay: "220ms" }}>
              我们是一个年轻的课题组，成立于 2025 年，专注于
              <strong className="font-semibold text-ink decoration-accent/40 underline-offset-4 hover:underline">芯片设计自动化（EDA）</strong>方向。
              围绕物理设计、布局布线、工程变更优化（ECO）等关键环节，结合机器学习与运筹优化方法，
              探索更智能、更高效的 EDA 算法与工具。
            </p>
            <div className="rise-in mt-10 flex flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
              <Link to="/students" className="btn-primary group !rounded-full !px-6 !py-2.5">
                <Users size={16} />了解组员<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/meetings" className="btn-secondary !rounded-full !px-6 !py-2.5">
                <Calendar size={16} />组会记录
              </Link>
              <Link to="/tasks" className="btn-secondary !rounded-full !px-6 !py-2.5">
                <BookOpen size={16} />研究进展
              </Link>
            </div>
          </div>

          {/* 右侧：原创品牌徽章，填充留白、平衡构图（小屏隐藏避免拥挤） */}
          <div className="hidden justify-center lg:flex">
            <div className="rise-in relative" style={{ animationDelay: "200ms" }}>
              {/* 徽章后的柔和光晕，增加层次 */}
              <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-accent/[0.06] blur-2xl" />
              <HeroLogo className="relative w-[264px] drop-shadow-[0_8px_24px_rgba(80,50,30,0.10)]" />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ================= 研究方向：编辑式错位排版，避免三条等宽卡片 ================= */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow mb-4"><FlaskConical size={12} className="text-accent" />研究方向</span>
            <h2 className="section-mark font-serif text-3xl font-bold tracking-heading text-ink sm:text-4xl">我们在做什么</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              从算法到工具，从理论到工程 —— 我们围绕芯片设计自动化的关键难题展开研究。
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* 头条方向：横向特写 + 巨型序号，承担视觉重心 */}
            <article className="surface group relative overflow-hidden p-7 transition-all duration-300 hover:border-accent/30 hover:shadow-lift lg:col-span-2">
              <div className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 font-serif text-[120px] font-black leading-none text-accent/[0.13] sm:text-[140px]">01</div>
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-accent to-accent-deep text-white shadow-brand shadow-hairline ring-1 ring-inset ring-white/15">
                  <Cpu size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink sm:text-2xl">{DIRECTIONS[0].title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-[1.9] text-body-strong">{DIRECTIONS[0].desc}</p>
                </div>
              </div>
            </article>

            {/* 另两条方向：带序号的小卡片 */}
            {DIRECTIONS.slice(1).map((d, i) => {
              const Icon = d.icon;
              return (
                <article key={d.title} className="surface group relative overflow-hidden p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lift">
                  <div className="pointer-events-none absolute right-5 top-4 font-serif text-[84px] font-black leading-none text-accent/[0.13]">0{i + 2}</div>
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-control bg-accent-wash text-accent ring-1 ring-inset ring-accent/15">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-ink">{d.title}</h3>
                    <p className="mt-2 text-sm leading-[1.9] text-body-strong">{d.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 成员进度概览 ================= */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-control bg-gradient-to-br from-accent to-accent-deep text-white shadow-brand shadow-hairline ring-1 ring-inset ring-white/15">
            <Users size={17} />
          </div>
          <div className="flex-1">
            <h2 className="section-mark font-serif text-2xl font-bold tracking-heading text-ink sm:text-3xl">成员进度概览</h2>
            <p className="mt-0.5 text-sm text-muted">指导老师 {advisor} · 组员 {members.length} 人</p>
          </div>
          <Link to="/students" className="group inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-deep">
            查看全部<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {members.length === 0 ? (
          <div className="surface px-6 py-14 text-center text-sm text-muted">暂无成员任务数据</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const s = statOf(m);
              return (
                <Link
                  key={m}
                  to={`/tasks?member=${encodeURIComponent(m)}`}
                  className="surface group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-wash font-serif text-sm font-bold text-accent ring-1 ring-accent/20">
                        {m.slice(0, 1)}
                      </span>
                      <span className="font-serif text-base font-semibold text-ink">{m}</span>
                    </div>
                    <span className="text-xs text-faint">{s.total} 项</span>
                  </div>
                  {/* 堆叠色带：进行中 / 挂起 / 已完成 按比例分段，空条比没有更糟 */}
                  <div
                    className="mt-4 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-wash"
                    role="img"
                    aria-label={s.total > 0 ? `共 ${s.total} 项：已完成 ${s.done}、进行中 ${s.active}、挂起 ${s.hold}` : "暂无任务"}
                  >
                    {s.done > 0 && <div className="h-full bg-success-ink/80" style={{ width: `${pctOf(s.done, s.total)}%` }} />}
                    {s.active > 0 && <div className="h-full bg-warning-ink/80" style={{ width: `${pctOf(s.active, s.total)}%` }} />}
                    {s.hold > 0 && <div className="h-full bg-danger-ink/80" style={{ width: `${pctOf(s.hold, s.total)}%` }} />}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {s.total === 0 ? (
                      <span className="text-faint">暂无任务</span>
                    ) : (
                      <>
                        {s.active > 0 && <span className="font-semibold text-warning-ink">进行中 {s.active}</span>}
                        {s.hold > 0 && <span className="font-semibold text-danger-ink">挂起 {s.hold}</span>}
                        {s.done > 0 && <span className="font-semibold text-success-ink">已完成 {s.done}</span>}
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 最近进展 ================= */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-control bg-gradient-to-br from-accent to-accent-deep text-white shadow-brand shadow-hairline ring-1 ring-inset ring-white/15">
              <TrendingUp size={17} />
            </div>
            <h2 className="section-mark font-serif text-2xl font-bold tracking-heading text-ink sm:text-3xl">最近进展</h2>
          </div>
          <div className="surface divide-y divide-wash overflow-hidden">
            {feed.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-faint">暂无进展记录</p>
            ) : feed.map(({ t, u }) => (
              <div key={t.id} className="px-5 py-3.5 transition-colors hover:bg-wash/40">
                {/* 移动端：日期与状态同一行 */}
                <div className="flex items-center justify-between gap-3 sm:hidden">
                  <span className="font-mono text-xs text-faint">{u!.date}</span>
                  <StatusBadge status={u!.status} />
                </div>

                {/* 桌面端：日期 / 内容 / 状态 三列固定，逐行严格对齐 */}
                <div className="mt-2 flex items-start gap-3 sm:mt-0 sm:grid sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                  <span className="hidden font-mono text-xs text-faint sm:block sm:pt-0.5">{u!.date}</span>

                  {/* 姓名与标题用子网格分列，备注固定在标题正下方 */}
                  <div className="flex min-w-0 items-start gap-3 sm:grid sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-x-3">
                    <span className="shrink-0 text-sm font-medium text-ink">
                      {t.assignees.length === 1 ? t.assignees[0] : `${t.assignees.slice(0, 2).join("、")}${t.assignees.length > 2 ? " 等" : ""}`}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed text-muted">{t.title}</p>
                      {u!.note && (
                        <p className="mt-1 text-xs leading-relaxed text-faint">（{u!.note}）</p>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block sm:pt-0.5">
                    <StatusBadge status={u!.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
