import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, Search, ChevronDown, ChevronRight, X, Info } from "lucide-react";
import { venueGuides, type GuideRow, type RequirementRow, type VenueGuide } from "@/data/degreeRequirements";

function Section({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
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
        <h2 className="font-serif text-base font-semibold text-[#1a1a1a] flex-1">{title}</h2>
        {count !== undefined && <span className="text-xs text-[#9a9590] shrink-0">{count} 条</span>}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-3">{children}</div>}
    </section>
  );
}

function Row({ children, tone }: { children: React.ReactNode; tone?: "note" }) {
  return (
    <div
      className={
        tone === "note"
          ? "rounded-xl border border-[#e8e4db] bg-[#faf9f5] px-4 py-3 text-sm text-[#6b6560] leading-relaxed"
          : "text-sm text-[#4a4540] leading-relaxed"
      }
    >
      {children}
    </div>
  );
}

function LevelBadge({ level }: { level?: string }) {
  if (!level) return null;
  const isA = level.startsWith("A");
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${
        isA ? "bg-[#fdf3ef] text-[#a1452a]" : "bg-[#f0ece4] text-[#6b6560]"
      }`}
    >
      {level}
    </span>
  );
}

function GuideTable({ rows }: { rows: GuideRow[] }) {
  if (rows.length === 0) return <Row tone="note">没有匹配的条目</Row>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8e4db]">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="bg-[#faf9f5] text-[#9a9590] text-xs">
            <th className="px-3 py-2 text-left font-medium">名称</th>
            <th className="px-3 py-2 text-left font-medium">简称</th>
            <th className="px-3 py-2 text-left font-medium">类型</th>
            <th className="px-3 py-2 text-left font-medium">等级</th>
            <th className="px-3 py-2 text-left font-medium">中科院</th>
            <th className="px-3 py-2 text-left font-medium">难度</th>
            <th className="px-3 py-2 text-left font-medium">说明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0ece4]">
          {rows.map((r, i) => (
            <tr key={`${r.abbr}-${i}`} className="align-top">
              <td className="px-3 py-2 text-[#1a1a1a] font-medium">{r.name}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.abbr}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.kind}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <LevelBadge level={r.level} />
              </td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.cas ?? "—"}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.difficulty}</td>
              <td className="px-3 py-2 text-[#6b6560]">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequirementTable({ rows }: { rows: RequirementRow[] }) {
  if (rows.length === 0) return <Row tone="note">没有匹配的内容</Row>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.degree} className="rounded-xl border border-[#e8e4db] overflow-hidden">
          <div className="bg-[#faf9f5] px-4 py-2 text-sm font-semibold text-[#c96442]">{r.degree}</div>
          <div className="px-4 py-3 space-y-2 text-sm text-[#4a4540] leading-relaxed">
            <p>
              <span className="inline-block w-16 shrink-0 text-[#9a9590] text-xs">基本要求</span>
              {r.basic}
            </p>
            <p>
              <span className="inline-block w-16 shrink-0 text-[#9a9590] text-xs">公开评阅</span>
              {r.publicReview}
            </p>
            {r.note && (
              <p className="flex items-start gap-1.5 text-xs text-[#b07a4a]">
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>{r.note}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GuideView({ g, q }: { g: VenueGuide; q: string }) {
  const hit = useCallback(
    (text: string) => {
      const t = q.trim().toLowerCase();
      if (!t) return true;
      return text.toLowerCase().includes(t);
    },
    [q]
  );

  const reqs = g.requirements.filter((r) => hit(`${r.degree} ${r.basic} ${r.publicReview} ${r.note ?? ""}`));
  const levelMap = g.levelMap
    .map((grp) => ({ ...grp, rows: grp.rows.filter((r) => hit(`${grp.title} ${r.name} ${r.abbr} ${r.note}`)) }))
    .filter((grp) => grp.rows.length > 0);
  const lists = g.lists
    .map((grp) => ({ ...grp, rows: grp.rows.filter((r) => hit(`${r.name} ${r.abbr} ${r.level ?? ""} ${r.note}`)) }))
    .filter((grp) => grp.rows.length > 0);
  const recs = g.recommendations
    .map((t) => ({ ...t, items: t.items.filter((r) => hit(`${r.name} ${r.abbr} ${r.note}`)) }))
    .filter((t) => t.items.length > 0);
  const caveats = g.caveats.filter((t) => hit(t));

  const nothing =
    reqs.length === 0 && levelMap.length === 0 && lists.length === 0 && recs.length === 0 && caveats.length === 0;

  return (
    <div className="space-y-4">
      <Section title="一、毕业要求速览" count={g.requirements.length}>
        <RequirementTable rows={reqs} />
      </Section>

      <Section title="二、目录分级与本组刊物的对应关系" count={g.levelMap.length}>
        <div className="space-y-5">
          {levelMap.length === 0 && <Row tone="note">没有匹配的条目</Row>}
          {levelMap.map((grp) => (
            <div key={grp.title}>
              <h3 className="text-sm font-semibold text-[#c96442] mb-0.5">{grp.title}</h3>
              {grp.desc && <p className="text-xs text-[#9a9590] mb-2">{grp.desc}</p>}
              <div className="space-y-2">
                {grp.rows.map((r) => (
                  <div key={r.name} className="flex gap-3">
                    <span className="shrink-0 min-w-[72px] text-sm font-semibold text-[#c96442]">{r.abbr}</span>
                    <p className="text-sm text-[#4a4540] leading-relaxed flex-1">
                      {r.name}
                      <span className="block text-xs text-[#9a9590] mt-0.5">{r.note}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="三、期刊与会议清单" count={lists.reduce((n, g2) => n + g2.rows.length, 0)}>
        <div className="space-y-5">
          {lists.length === 0 && <Row tone="note">没有匹配的条目</Row>}
          {lists.map((grp) => (
            <div key={grp.title}>
              <h3 className="text-sm font-semibold text-[#c96442] mb-0.5">{grp.title}</h3>
              {grp.desc && <p className="text-xs text-[#9a9590] mb-2">{grp.desc}</p>}
              <GuideTable rows={grp.rows} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="四、本组方向的投稿梯队" count={recs.length}>
        <div className="space-y-5">
          {recs.length === 0 && <Row tone="note">没有匹配的条目</Row>}
          {recs.map((t) => (
            <div key={t.tier}>
              <h3 className="text-sm font-semibold text-[#c96442] mb-0.5">{t.tier}</h3>
              <p className="text-xs text-[#9a9590] mb-2">{t.purpose}</p>
              <GuideTable rows={t.items} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="五、口径提示" count={g.caveats.length}>
        <ol className="space-y-2">
          {caveats.length === 0 && <Row tone="note">没有匹配的说明</Row>}
          {caveats.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#4a4540] leading-relaxed">
              <span className="shrink-0 text-[#9a9590]">{i + 1}.</span>
              <span className="flex-1">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      {nothing && q.trim() && (
        <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-12 text-center">
          <Search size={28} className="mx-auto text-[#9a9590]" />
          <p className="mt-3 text-sm text-[#6b6560]">没有找到包含「{q}」的内容</p>
        </div>
      )}
    </div>
  );
}

export default function DegreeRequirements() {
  const [active, setActive] = useState(venueGuides[0].id);
  const [q, setQ] = useState("");

  const g = venueGuides.find((x) => x.id === active) ?? venueGuides[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <p className="text-sm text-[#6b6560] mt-1">
              计算机科学与技术 / 软件工程 · 集成电路科学与工程 · 电子信息
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {venueGuides.map((x) => (
          <button
            key={x.id}
            onClick={() => setActive(x.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
              active === x.id
                ? "border-[#c96442] bg-[#fdf3ef]"
                : "border-[#e8e4db] bg-white hover:border-[#c96442]/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${active === x.id ? "text-[#a1452a]" : "text-[#1a1a1a]"}`}>
                {x.name}
              </span>
              <span className="text-[11px] text-[#9a9590] whitespace-nowrap">{x.code}</span>
            </div>
            <p className="mt-1 text-xs text-[#6b6560] leading-snug">{x.tagline}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-[#e8b4a4] bg-[#fdf3ef] px-4 py-3 text-xs text-[#a1452a] leading-relaxed">
        {g.disclaimer}（整理于 {g.updatedAt}）
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5">
        <Search size={15} className="text-[#9a9590] shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="检索关键词，如：DAC、TCAD、A-1、中科院 1 区、专利、NSREC、预警名单、博士"
          className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#b5b0aa]"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-[#9a9590] hover:text-[#c96442]" title="清除">
            <X size={15} />
          </button>
        )}
      </div>

      <GuideView key={g.id} g={g} q={q} />
    </div>
  );
}