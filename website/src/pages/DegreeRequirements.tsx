import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Info,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  Award,
  Compass,
  FileText,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { GOTCHAS, VENUE_SOURCES, FIELD_TAGS, type FieldTag } from "@/data/venueCatalog";
import {
  PROGRAMS,
  GRADE_ORDER,
  gradedVenues,
  fieldCounts,
  type GradedVenue,
  type GradeId,
} from "@/data/venueGrades";
import { findRequirement } from "@/data/degreeRequirements";
import { useTaskStore } from "@/store/tasks";
import { useAchievementStore } from "@/store/achievements";
import { auditCandidate } from "@/lib/degreeAudit";
import DegreeBoard from "@/components/DegreeBoard";

type ProgramName = (typeof PROGRAMS)[number]["program"];

function Section({
  title,
  desc,
  children,
  defaultOpen = false,
  count,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl bg-paper border border-line overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-paper transition-colors"
      >
        {open ? (
          <ChevronDown size={15} className="text-accent shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-faint shrink-0" />
        )}
        <h2 className="font-serif text-base font-semibold text-ink">{title}</h2>
        <span className="text-xs text-faint shrink-0 ml-auto">{count !== undefined ? `${count} 条` : ""}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3">
          {desc && <p className="text-xs text-faint leading-relaxed">{desc}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

/** 学位达成详情：默认收起，点击展开 DegreeBoard；学生对象按姓名从 store 取，保证与卡片入口一致 */
function DegreeDetails({ studentName }: { studentName: string }) {
  const [open, setOpen] = useState(false);
  const student = useTaskStore((s) => s.members).find((m) => m.name === studentName);
  if (!student) return null;
  return (
    <div className="border-t border-line">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-wash/50"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? "收起判定详情" : "展开判定详情"}
        </span>
        <span className="text-[11px] text-faint">基本要求 / 公开评审通道 / 逐篇等级</span>
      </button>
      {open && (
        <div className="border-t border-line bg-paper px-5 py-4">
          <DegreeBoard student={student} />
        </div>
      )}
    </div>
  );
}

function Tag({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "red" | "green" | "blue" }) {
  const cls =
    tone === "red"
      ? "bg-danger-wash text-danger-ink"
      : tone === "green"
        ? "bg-success-wash text-success-ink"
        : tone === "blue"
          ? "bg-info-wash text-info-ink"
          : "bg-wash text-muted";
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap ${cls}`}>{children}</span>;
}

function GradeTag({ g }: { g: GradeId }) {
  if (!g) return null;
  const tone = g === "一类目录" || g.startsWith("A") ? "red" : "gray";
  return <Tag tone={tone}>{g}</Tag>;
}

function VenueTable({ rows }: { rows: GradedVenue[] }) {
  if (rows.length === 0) return <p className="text-sm text-faint">没有匹配的条目</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm min-w-[860px]">
        <thead>
          <tr className="bg-paper text-faint text-xs">
            <th className="px-3 py-2 text-left font-medium">简称</th>
            <th className="px-3 py-2 text-left font-medium">全称</th>
            <th className="px-3 py-2 text-left font-medium">类型</th>
            <th className="px-3 py-2 text-left font-medium">对口方向</th>
            <th className="px-3 py-2 text-left font-medium">档位</th>
            <th className="px-3 py-2 text-left font-medium">CCF</th>
            <th className="px-3 py-2 text-left font-medium">中科院</th>
            <th className="px-3 py-2 text-left font-medium">其他认定</th>
            <th className="px-3 py-2 text-left font-medium">说明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-wash">
          {rows.map((r) => (
            <tr key={`${r.kind}-${r.abbr}`} className="align-top hover:bg-paper">
              <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">{r.abbr}</td>
              <td className="px-3 py-2 text-muted max-w-[260px]">{r.name}</td>
              <td className="px-3 py-2 text-body-strong whitespace-nowrap">{r.kind}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1 max-w-[160px]">
                  {r.fields.map((f) => (
                    <Tag key={f} tone="blue">
                      {f}
                    </Tag>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <GradeTag g={r.grade} />
              </td>
              <td className="px-3 py-2 text-body-strong whitespace-nowrap">
                {r.ccf ? `${r.ccf} 类` : <span className="text-line-strong">不在目录</span>}
              </td>
              <td className="px-3 py-2 text-body-strong whitespace-nowrap">
                {r.cas ? r.cas : r.kind === "会议" ? <span className="text-line-strong">—</span> : <span className="text-line-strong">未知</span>}
                {r.casTop && " · Top"}
                {r.casMajor && <div className="text-[11px] text-faint">{r.casMajor}</div>}
              </td>
              <td className="px-3 py-2 text-xs text-muted space-y-0.5">
                {r.tier1 && <div>一类目录</div>}
                {r.ccfTj && <div>CCF 高质量 {r.ccfTj}</div>}
                {r.csee && <div>电子学会 {r.csee}</div>}
                {r.namedInDoc && <div>原文单列</div>}
                {r.issn && <div className="text-line-strong">ISSN {r.issn}</div>}
                {!r.tier1 && !r.ccfTj && !r.csee && !r.namedInDoc && !r.issn && <span className="text-line-strong">—</span>}
              </td>
              <td className="px-3 py-2 text-muted max-w-[400px]">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VenueList({ program }: { program: ProgramName }) {
  const [query, setQuery] = useState("");
  const [field, setField] = useState<FieldTag | "全部">("全部");
  const [grade, setGrade] = useState<GradeId | "全部">("全部");
  const [kind, setKind] = useState<"全部" | "期刊" | "会议">("全部");

  const counts = useMemo(() => fieldCounts(program), [program]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gradedVenues(program, field).filter((v) => {
      if (grade !== "全部" && v.grade !== grade) return false;
      if (kind !== "全部" && v.kind !== kind) return false;
      if (!q) return true;
      const hay = [v.abbr, v.name, v.note, v.ccfDomain ?? "", v.cas ?? "", ...v.fields].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [program, field, grade, kind, query]);

  // 按档位分组渲染，档位内部保持排序
  const grouped = useMemo(() => {
    const map = new Map<GradeId, GradedVenue[]>();
    for (const r of rows) {
      const arr = map.get(r.grade) ?? [];
      arr.push(r);
      map.set(r.grade, arr);
    }
    return GRADE_ORDER.filter((g) => map.has(g)).map((g) => ({ grade: g, rows: map.get(g)! }));
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
          <Search size={15} className="text-faint shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜简称或全称，如 TCAD、DAC、NSREC、Nature"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-line-strong"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-faint hover:text-accent" title="清除">
              <X size={15} />
            </button>
          )}
        </div>

        <div>
          <div className="text-xs text-faint mb-1.5">按研究方向</div>
          <div className="flex flex-wrap gap-1.5">
            {counts.map(({ field: f, count }) => (
              <button
                key={f}
                onClick={() => setField(f)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  field === f
                    ? "border-accent bg-danger-wash text-danger-ink"
                    : "border-line text-muted hover:border-accent/40"
                }`}
              >
                {f} <span className="text-line-strong">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-faint mb-1.5">按档位</div>
            <div className="flex flex-wrap gap-1.5">
              {(["全部", ...GRADE_ORDER] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g as GradeId | "全部")}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    grade === g
                      ? "border-accent bg-danger-wash text-danger-ink"
                      : "border-line text-muted hover:border-accent/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-faint mb-1.5">按类型</div>
            <div className="flex gap-1.5">
              {(["全部", "期刊", "会议"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    kind === k
                      ? "border-accent bg-danger-wash text-danger-ink"
                      : "border-line text-muted hover:border-accent/40"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-faint">
          共 {rows.length} 条
          {rows.length !== counts[0].count && `（全部 ${counts[0].count} 条）`}
        </p>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-2xl bg-paper border border-line px-6 py-12 text-center">
          <Search size={28} className="mx-auto text-faint" />
          <p className="mt-3 text-sm text-muted">没有找到符合条件的条目</p>
        </div>
      )}

      {grouped.map(({ grade: g, rows: rs }) => (
        <Section key={g} title={g} count={rs.length}>
          <VenueTable rows={rs} />
        </Section>
      ))}
    </div>
  );
}

export default function DegreeRequirements() {
  const [params] = useSearchParams();
  const [program, setProgram] = useState<ProgramName>("集成电路科学与工程");
  const meta = PROGRAMS.find((p) => p.program === program) ?? PROGRAMS[0];

  // 从成员卡片入口带过来的 student 参数定位学生；默认取在读学生中的第一位。
  const members = useTaskStore((s) => s.members);
  const students = members.filter((m) => m.role !== "teacher");
  const studentName = params.get("student");
  const student =
    students.find((s) => s.name === studentName) ??
    students.find((s) => s.status === "在读") ??
    students[0];

  const achievements = useAchievementStore((s) => s.achievements);
  const audit = useMemo(() => {
    if (!student?.program || !student?.degree) return null;
    return auditCandidate(
      { name: student.name, program: student.program, degree: student.degree },
      achievements
    );
  }, [achievements, student?.name, student?.program, student?.degree]);
  const paperCount = audit?.papers.filter((p) => p.level !== "非目录" && p.credited).length ?? 0;

  // 条款按 id 取：cs-硕士 / ice-博士 等；findRequirement 的第二参数是 requirementId，
  // 不是「硕士 / 博士」这两个字，早前传错导致「本专业成果要求」区块一直是空的。
  const basicD = findRequirement(program, `${meta.id}-硕士`);
  const basicB = findRequirement(program, `${meta.id}-博士`);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
      <div className="mb-8">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          返回成员
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">学位要求与选刊指南</h1>
            <p className="text-sm text-muted mt-1">查看个人学位达成状态，按专业查期刊会议、核对等级</p>
          </div>
        </div>
      </div>

      {/* 个人学位达成状态：默认收起，点击展开详情（由成员卡片入口跳转而来） */}
      {student && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent ring-1 ring-inset ring-accent/15">
                <Award size={19} />
              </div>
              <div>
                <p className="font-serif text-base font-semibold text-ink">
                  {student.name} · {student.degree ?? "硕士"}毕业要求
                </p>
                <p className="mt-0.5 text-xs text-muted">{student.program ?? "集成电路科学与工程"}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-wash px-2.5 py-1 text-xs text-muted">
              <FileText size={12} />目录内成果 {paperCount} 篇
            </span>
          </div>
          {audit ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-5 py-3 text-xs">
                <span className="inline-flex items-center gap-1 text-muted">
                  {audit.basicReady ? <CheckCircle2 size={13} className="text-success-ink" /> : <Circle size={13} className="text-line-strong" />}
                  基本要求{audit.basicReady ? "已达成" : "未达成"}
                </span>
                <span className="inline-flex items-center gap-1 text-muted">
                  {audit.publicReady ? <CheckCircle2 size={13} className="text-success-ink" /> : <Circle size={13} className="text-line-strong" />}
                  公开评审{audit.publicReady ? "已满足一条通道" : "尚未满足"}
                </span>
              </div>
              <DegreeDetails studentName={student.name} />
            </>
          ) : (
            <p className="border-t border-line px-5 py-3 text-xs text-warning-ink">
              未设置学科 / 学位层次，无法判定毕业要求 —— 可在成员页点「编辑」补上。
            </p>
          )}
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProgram(p.program)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
              program === p.program ? "border-accent bg-danger-wash" : "border-line bg-paper hover:border-accent/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${program === p.program ? "text-danger-ink" : "text-ink"}`}>
                {p.name}
              </span>
              <span className="text-[11px] text-faint whitespace-nowrap">{p.code}</span>
            </div>
            <p className="mt-1 text-xs text-muted leading-snug">{p.tagline}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-danger-line bg-danger-wash px-4 py-3 text-xs text-danger-ink leading-relaxed">
        <Info size={12} className="inline mr-1 -mt-0.5" />
        等级数据来自 CCF 官方目录、CCF 高质量科技期刊分级目录、中科院分区表与电子学会分级目录的公开信息逐条核对；
        <b>查不到的一律留空显示「未知」，不做推测</b>。成果认定一律以申请学位时学院执行的目录版本为准。
      </div>

      <div className="space-y-4">
        <Section title="选刊指南 · 如何用好这份手册" defaultOpen={false}>
          <ol className="space-y-2.5">
            {[
              { n: "1", t: "先看状态", d: "页面顶部显示本人的学位达成状态与目录内成果数，点「展开判定详情」查看逐条规则。" },
              { n: "2", t: "选对学科", d: "在上方切换到本人所在学科（如集成电路科学与工程），清单与等级只按该学科口径判定。" },
              { n: "3", t: "按方向找刊", d: "在「期刊与会议清单」里按研究方向、档位、类型筛选，优先看对口方向且档位达标的目标。" },
              { n: "4", t: "核对认定", d: "投稿前核对最新版目录与预警名单；成果认定一律以申请学位时学院执行的目录版本为准。" },
            ].map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-wash text-xs font-semibold text-accent ring-1 ring-inset ring-accent/15">{s.n}</span>
                <p className="text-sm leading-relaxed text-body-strong">
                  <span className="font-semibold text-ink">{s.t}：</span>{s.d}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-line bg-canvas/60 px-3 py-2 text-xs text-muted">
            <Compass size={13} className="mt-0.5 shrink-0 text-accent" />
            档位从高到低为「一类目录 / A 档 / B 档 / 基本目录」；「基本目录」只用于满足基本要求，公开评审需更高档位。
          </p>
        </Section>

        <Section title="一、本专业的成果要求（硕士 / 博士）" count={2}>
          <div className="space-y-3">
            {[
              { label: "硕士", row: basicD },
              { label: "博士", row: basicB },
            ].map(({ label, row }) => (
              <div key={label} className="rounded-xl border border-line overflow-hidden">
                <div className="bg-paper px-4 py-2 text-sm font-semibold text-accent">{label}</div>
                <div className="px-4 py-3 space-y-2 text-sm text-body-strong leading-relaxed">
                  <p>
                    <span className="inline-block w-16 shrink-0 text-faint text-xs">基本要求</span>
                    {row?.basic ?? "原文未列出"}
                  </p>
                  <p>
                    <span className="inline-block w-16 shrink-0 text-faint text-xs">公开评阅</span>
                    {row?.publicReview ?? "原文未列出"}
                  </p>
                  {row?.note && (
                    <p className="flex items-start gap-1.5 text-xs text-warning-ink">
                      <Info size={12} className="shrink-0 mt-0.5" />
                      <span>{row.note}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="二、期刊与会议清单" desc={`${meta.name}（${meta.code}，${meta.unit}）对应的档位判定`}>
          <VenueList program={program} />
        </Section>

        <Section title="三、容易搞错的条目" defaultOpen={false}>
          <ul className="space-y-2">
            {GOTCHAS.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-body-strong leading-relaxed">
                <AlertTriangle size={13} className="shrink-0 mt-1 text-warning-ink" />
                <span className="flex-1">{g}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="四、数据来源" defaultOpen={false}>
          <ul className="space-y-2.5">
            {VENUE_SOURCES.map((s) => (
              <li key={s.id} className="text-sm">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  <BookOpen size={13} />
                  {s.label}
                  <ExternalLink size={11} />
                </a>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{s.detail}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="五、方向标签说明" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {FIELD_TAGS.map((f) => (
              <Tag key={f} tone="blue">
                {f}
              </Tag>
            ))}
          </div>
          <p className="text-xs text-faint leading-relaxed mt-2">
            一个条目可以有多个标签（例如 NSREC 同时属于「辐射效应」与「测试与可靠性」）。筛选时按标签取并集，
            便于从「我做的方向」出发找刊，而不是从刊名猜。
          </p>
        </Section>
      </div>
    </div>
  );
}