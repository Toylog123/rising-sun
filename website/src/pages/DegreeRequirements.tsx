import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

type ProgramName = (typeof PROGRAMS)[number]["program"];

function Section({
  title,
  desc,
  children,
  defaultOpen = true,
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
    <section className="rounded-2xl bg-white border border-[#e8e4db] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-[#faf9f5] transition-colors"
      >
        {open ? (
          <ChevronDown size={15} className="text-[#c96442] shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-[#9a9590] shrink-0" />
        )}
        <h2 className="font-serif text-base font-semibold text-[#1a1a1a]">{title}</h2>
        <span className="text-xs text-[#9a9590] shrink-0 ml-auto">{count !== undefined ? `${count} 条` : ""}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3">
          {desc && <p className="text-xs text-[#9a9590] leading-relaxed">{desc}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

function Tag({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "red" | "green" | "blue" }) {
  const cls =
    tone === "red"
      ? "bg-[#fdf3ef] text-[#a1452a]"
      : tone === "green"
        ? "bg-[#eef6ee] text-[#3d7a3d]"
        : tone === "blue"
          ? "bg-[#eef2f8] text-[#3d5878]"
          : "bg-[#f0ece4] text-[#6b6560]";
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap ${cls}`}>{children}</span>;
}

function GradeTag({ g }: { g: GradeId }) {
  if (!g) return null;
  const tone = g === "一类目录" || g.startsWith("A") ? "red" : "gray";
  return <Tag tone={tone}>{g}</Tag>;
}

function VenueTable({ rows }: { rows: GradedVenue[] }) {
  if (rows.length === 0) return <p className="text-sm text-[#9a9590]">没有匹配的条目</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8e4db]">
      <table className="w-full text-sm min-w-[860px]">
        <thead>
          <tr className="bg-[#faf9f5] text-[#9a9590] text-xs">
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
        <tbody className="divide-y divide-[#f0ece4]">
          {rows.map((r) => (
            <tr key={`${r.kind}-${r.abbr}`} className="align-top hover:bg-[#faf9f5]">
              <td className="px-3 py-2 font-semibold text-[#1a1a1a] whitespace-nowrap">{r.abbr}</td>
              <td className="px-3 py-2 text-[#6b6560] max-w-[260px]">{r.name}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.kind}</td>
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
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">
                {r.ccf ? `${r.ccf} 类` : <span className="text-[#b5b0aa]">不在目录</span>}
              </td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">
                {r.cas ? r.cas : r.kind === "会议" ? <span className="text-[#b5b0aa]">—</span> : <span className="text-[#b5b0aa]">未知</span>}
                {r.casTop && " · Top"}
                {r.casMajor && <div className="text-[11px] text-[#9a9590]">{r.casMajor}</div>}
              </td>
              <td className="px-3 py-2 text-xs text-[#6b6560] space-y-0.5">
                {r.tier1 && <div>一类目录</div>}
                {r.ccfTj && <div>CCF 高质量 {r.ccfTj}</div>}
                {r.csee && <div>电子学会 {r.csee}</div>}
                {r.namedInDoc && <div>原文单列</div>}
                {r.issn && <div className="text-[#b5b0aa]">ISSN {r.issn}</div>}
                {!r.tier1 && !r.ccfTj && !r.csee && !r.namedInDoc && !r.issn && <span className="text-[#b5b0aa]">—</span>}
              </td>
              <td className="px-3 py-2 text-[#6b6560] max-w-[400px]">{r.note}</td>
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
      <div className="rounded-2xl bg-white border border-[#e8e4db] p-4 space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-[#e8e4db] px-3 py-2">
          <Search size={15} className="text-[#9a9590] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜简称或全称，如 TCAD、DAC、NSREC、Nature"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#b5b0aa]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#9a9590] hover:text-[#c96442]" title="清除">
              <X size={15} />
            </button>
          )}
        </div>

        <div>
          <div className="text-xs text-[#9a9590] mb-1.5">按研究方向</div>
          <div className="flex flex-wrap gap-1.5">
            {counts.map(({ field: f, count }) => (
              <button
                key={f}
                onClick={() => setField(f)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  field === f
                    ? "border-[#c96442] bg-[#fdf3ef] text-[#a1452a]"
                    : "border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/40"
                }`}
              >
                {f} <span className="text-[#b5b0aa]">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-[#9a9590] mb-1.5">按档位</div>
            <div className="flex flex-wrap gap-1.5">
              {(["全部", ...GRADE_ORDER] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g as GradeId | "全部")}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    grade === g
                      ? "border-[#c96442] bg-[#fdf3ef] text-[#a1452a]"
                      : "border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#9a9590] mb-1.5">按类型</div>
            <div className="flex gap-1.5">
              {(["全部", "期刊", "会议"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    kind === k
                      ? "border-[#c96442] bg-[#fdf3ef] text-[#a1452a]"
                      : "border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/40"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#9a9590]">
          共 {rows.length} 条
          {rows.length !== counts[0].count && `（全部 ${counts[0].count} 条）`}
        </p>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-12 text-center">
          <Search size={28} className="mx-auto text-[#9a9590]" />
          <p className="mt-3 text-sm text-[#6b6560]">没有找到符合条件的条目</p>
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
  const [program, setProgram] = useState<ProgramName>("集成电路科学与工程");
  const meta = PROGRAMS.find((p) => p.program === program) ?? PROGRAMS[0];

  const basicD = findRequirement(program, "硕士");
  const basicB = findRequirement(program, "博士");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-1.5 text-sm text-[#6b6560] hover:text-[#c96442] transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          返回组会记录
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#c96442] text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">学位成果选刊手册</h1>
            <p className="text-sm text-[#6b6560] mt-1">按专业查期刊会议、核对等级、对研究方向</p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProgram(p.program)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
              program === p.program ? "border-[#c96442] bg-[#fdf3ef]" : "border-[#e8e4db] bg-white hover:border-[#c96442]/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${program === p.program ? "text-[#a1452a]" : "text-[#1a1a1a]"}`}>
                {p.name}
              </span>
              <span className="text-[11px] text-[#9a9590] whitespace-nowrap">{p.code}</span>
            </div>
            <p className="mt-1 text-xs text-[#6b6560] leading-snug">{p.tagline}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-[#e8b4a4] bg-[#fdf3ef] px-4 py-3 text-xs text-[#a1452a] leading-relaxed">
        <Info size={12} className="inline mr-1 -mt-0.5" />
        等级数据来自 CCF 官方目录、CCF 高质量科技期刊分级目录、中科院分区表与电子学会分级目录的公开信息逐条核对；
        <b>查不到的一律留空显示「未知」，不做推测</b>。成果认定一律以申请学位时学院执行的目录版本为准。
      </div>

      <div className="space-y-4">
        <Section title="一、本专业的成果要求（硕士 / 博士）" count={2}>
          <div className="space-y-3">
            {[
              { label: "硕士", row: basicD },
              { label: "博士", row: basicB },
            ].map(({ label, row }) => (
              <div key={label} className="rounded-xl border border-[#e8e4db] overflow-hidden">
                <div className="bg-[#faf9f5] px-4 py-2 text-sm font-semibold text-[#c96442]">{label}</div>
                <div className="px-4 py-3 space-y-2 text-sm text-[#4a4540] leading-relaxed">
                  <p>
                    <span className="inline-block w-16 shrink-0 text-[#9a9590] text-xs">基本要求</span>
                    {row?.basic ?? "原文未列出"}
                  </p>
                  <p>
                    <span className="inline-block w-16 shrink-0 text-[#9a9590] text-xs">公开评阅</span>
                    {row?.publicReview ?? "原文未列出"}
                  </p>
                  {row?.note && (
                    <p className="flex items-start gap-1.5 text-xs text-[#b07a4a]">
                      <Info size={12} className="shrink-0 mt-0.5" />
                      <span>{row.note}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="二、期刊与会议清单" desc={`${meta.name}（${meta.code}，${meta.unit}）对应的档位判定`} defaultOpen>
          <VenueList program={program} />
        </Section>

        <Section title="三、容易搞错的条目" defaultOpen={false}>
          <ul className="space-y-2">
            {GOTCHAS.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#4a4540] leading-relaxed">
                <AlertTriangle size={13} className="shrink-0 mt-1 text-[#b07a4a]" />
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
                  className="inline-flex items-center gap-1 font-medium text-[#c96442] hover:underline"
                >
                  <BookOpen size={13} />
                  {s.label}
                  <ExternalLink size={11} />
                </a>
                <p className="text-xs text-[#6b6560] mt-0.5 leading-relaxed">{s.detail}</p>
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
          <p className="text-xs text-[#9a9590] leading-relaxed mt-2">
            一个条目可以有多个标签（例如 NSREC 同时属于「辐射效应」与「测试与可靠性」）。筛选时按标签取并集，
            便于从「我做的方向」出发找刊，而不是从刊名猜。
          </p>
        </Section>
      </div>
    </div>
  );
}