import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, Search, BookOpen, FileText, ChevronDown, ChevronRight, X } from "lucide-react";
import { disciplines, venueGuide, type Discipline, type GuideRow, type VenueGuide } from "@/data/degreeRequirements";

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
        {open ? <ChevronDown size={15} className="text-[#c96442] shrink-0" /> : <ChevronRight size={15} className="text-[#9a9590] shrink-0" />}
        <h2 className="font-serif text-base font-semibold text-[#1a1a1a] flex-1">{title}</h2>
        {count !== undefined && (
          <span className="text-xs text-[#9a9590] shrink-0">{count} 条</span>
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-3">{children}</div>}
    </section>
  );
}

function Item({ children, tone }: { children: React.ReactNode; tone?: "note" }) {
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

function DisciplineView({ d, q }: { d: Discipline; q: string }) {
  const hit = useCallback((text: string) => {
    if (!q.trim()) return true;
    return text.toLowerCase().includes(q.trim().toLowerCase());
  }, [q]);

  const tier1 = d.catalog.tier1.filter((r) => hit(`${r.idx} ${r.name} ${r.issn} ${r.indexing} ${r.reason}`));
  const tierA = d.catalog.tierA.filter((e) => hit(`${e.code} ${e.text} ${e.extra ?? ""}`));
  const tierB = d.catalog.tierB.filter((e) => hit(`${e.code} ${e.text}`));
  const basic = d.catalog.basicCatalog.filter((t) => hit(t));
  const remarks = d.catalog.remarks.filter((t) => hit(t));
  const review = d.doctoral.publicReview.filter((c) => hit(`${c.no} ${c.text}`));
  const mReview = d.master.publicReview.filter((c) => hit(`${c.no} ${c.text}`));
  const notes = d.notes.filter((t) => hit(t));
  const doctoralBasic = hit(d.doctoral.basic);
  const earlyApply = hit(d.doctoral.earlyApply);
  const mBasic = d.master.basic.filter((t) => hit(t));

  const empty =
    tier1.length === 0 &&
    tierA.length === 0 &&
    tierB.length === 0 &&
    basic.length === 0 &&
    remarks.length === 0 &&
    review.length === 0 &&
    mReview.length === 0 &&
    notes.length === 0 &&
    !doctoralBasic &&
    !earlyApply &&
    mBasic.length === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-[#e8e4db] px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-[#9a9590]">
          学科代码 <b className="text-[#1a1a1a] font-medium ml-1">{d.code}</b>
        </span>
        <span className="text-[#9a9590]">
          牵头制定单位 <b className="text-[#1a1a1a] font-medium ml-1">{d.unit}</b>
        </span>
        <span className="text-[#9a9590]">
          适用对象 <b className="text-[#1a1a1a] font-medium ml-1">{d.audience}</b>
        </span>
      </div>

      <Section title="一、博士学位论文" defaultOpen>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-1.5">（一）基本要求</h3>
            {doctoralBasic ? <Item>{d.doctoral.basic}</Item> : null}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-1.5">
              （二）公开评阅要求
              <span className="ml-2 text-xs font-normal text-[#9a9590]">满足基本要求后，全部紧密相关成果符合下列条件之一即可</span>
            </h3>
            <div className="space-y-2">
              {review.length === 0 && <Item tone="note">没有匹配的条款</Item>}
              {review.map((c) => (
                <div key={c.no} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#f0ece4] text-[#6b6560] text-xs flex items-center justify-center mt-0.5">
                    {c.no}
                  </span>
                  <p className="text-sm text-[#4a4540] leading-relaxed flex-1">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-1.5">（三）提前申请学位要求</h3>
            {earlyApply && <Item>{d.doctoral.earlyApply}</Item>}
            {d.doctoral.earlyApplyNote && (
              <div className="mt-2">
                <Item tone="note">⚠️ {d.doctoral.earlyApplyNote}</Item>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="二、硕士学位论文" defaultOpen>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-1.5">（一）基本要求</h3>
            <div className="space-y-2">
              {mBasic.length === 0 && <Item tone="note">没有匹配的内容</Item>}
              {mBasic.map((t, i) => (
                <Item key={i}>{t}</Item>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-1.5">（二）公开评阅要求</h3>
            <div className="space-y-2">
              {mReview.length === 0 && <Item tone="note">没有匹配的条款</Item>}
              {mReview.map((c) => (
                <div key={c.no} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#f0ece4] text-[#6b6560] text-xs flex items-center justify-center mt-0.5">
                    {c.no}
                  </span>
                  <p className="text-sm text-[#4a4540] leading-relaxed flex-1">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="三、其他说明" defaultOpen count={notes.length}>
        <ol className="space-y-2">
          {notes.length === 0 && <Item tone="note">没有匹配的说明</Item>}
          {notes.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#4a4540] leading-relaxed">
              <span className="shrink-0 text-[#9a9590]">{i + 1}.</span>
              <span className="flex-1">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="附件：紧密相关成果范围目录" defaultOpen>
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-2">一类目录</h3>
            {tier1.length === 0 ? (
              <Item tone="note">没有匹配的条目</Item>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#e8e4db]">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-[#faf9f5] text-[#9a9590] text-xs">
                      <th className="px-3 py-2 text-left font-medium w-12">序号</th>
                      <th className="px-3 py-2 text-left font-medium">期刊名</th>
                      <th className="px-3 py-2 text-left font-medium">刊号</th>
                      <th className="px-3 py-2 text-left font-medium">检索收录情况</th>
                      <th className="px-3 py-2 text-left font-medium">推荐理由</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ece4]">
                    {tier1.map((r) => (
                      <tr key={r.idx} className="align-top">
                        <td className="px-3 py-2 text-[#9a9590]">{r.idx}</td>
                        <td className="px-3 py-2 text-[#1a1a1a] font-medium">
                          {r.name}
                          {r.note && (
                            <span className="block mt-0.5 text-xs font-normal text-[#b07a4a] leading-snug">{r.note}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.issn}</td>
                        <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.indexing}</td>
                        <td className="px-3 py-2 text-[#6b6560]">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-2">二类（A）目录</h3>
            {tierA.length === 0 ? (
              <Item tone="note">没有匹配的条目</Item>
            ) : (
              <div className="space-y-2">
                {tierA.map((e) => (
                  <div key={e.code} className="flex gap-3">
                    <span className="shrink-0 w-12 text-sm font-semibold text-[#c96442]">{e.code}</span>
                    <p className="text-sm text-[#4a4540] leading-relaxed flex-1">
                      {e.text}
                      {e.extra && <span className="block text-xs text-[#9a9590] mt-0.5">{e.extra}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-2">二类（B）目录</h3>
            {tierB.length === 0 ? (
              <Item tone="note">没有匹配的条目</Item>
            ) : (
              <div className="space-y-2">
                {tierB.map((e) => (
                  <div key={e.code} className="flex gap-3">
                    <span className="shrink-0 w-12 text-sm font-semibold text-[#c96442]">{e.code}</span>
                    <p className="text-sm text-[#4a4540] leading-relaxed flex-1">{e.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-2">基本目录</h3>
            {basic.length === 0 ? (
              <Item tone="note">没有匹配的内容</Item>
            ) : (
              <div className="space-y-2">
                {basic.map((t, i) => (
                  <Item key={i}>{t}</Item>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-2">备注</h3>
            <ol className="space-y-2">
              {remarks.length === 0 && <Item tone="note">没有匹配的备注</Item>}
              {remarks.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#4a4540] leading-relaxed">
                  <span className="shrink-0 text-[#9a9590]">{i + 1}.</span>
                  <span className="flex-1">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {empty && q.trim() && (
        <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-12 text-center">
          <Search size={28} className="mx-auto text-[#9a9590]" />
          <p className="mt-3 text-sm text-[#6b6560]">没有找到包含「{q}」的内容</p>
        </div>
      )}
    </div>
  );
}

function GuideTable({ rows }: { rows: GuideRow[] }) {
  if (rows.length === 0) return <Item tone="note">没有匹配的条目</Item>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8e4db]">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-[#faf9f5] text-[#9a9590] text-xs">
            <th className="px-3 py-2 text-left font-medium">名称</th>
            <th className="px-3 py-2 text-left font-medium">简称</th>
            <th className="px-3 py-2 text-left font-medium">数据库</th>
            <th className="px-3 py-2 text-left font-medium">影响因子</th>
            <th className="px-3 py-2 text-left font-medium">中科院分区</th>
            <th className="px-3 py-2 text-left font-medium">投稿难度</th>
            <th className="px-3 py-2 text-left font-medium">备注</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0ece4]">
          {rows.map((r) => (
            <tr key={r.name} className="align-top">
              <td className="px-3 py-2 text-[#1a1a1a] font-medium">{r.name}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.abbr}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.db ?? "—"}</td>
              <td className="px-3 py-2 text-[#4a4540] whitespace-nowrap">{r.if ?? "—"}</td>
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

function GuideView({ g, q }: { g: VenueGuide; q: string }) {
  const hit = useCallback(
    (text: string) => {
      if (!q.trim()) return true;
      return text.toLowerCase().includes(q.trim().toLowerCase());
    },
    [q]
  );

  const quick = g.quickView.filter((r) => hit(`${r.degree} ${r.basic} ${r.publicReview}`));
  const tier1 = g.tier1Extra.filter((r) => hit(`${r.name} ${r.abbr} ${r.db ?? ""} ${r.if ?? ""} ${r.cas ?? ""} ${r.difficulty} ${r.note}`));
  const tierA1 = g.tierA1
    .map((grp) => ({ ...grp, rows: grp.rows.filter((r) => hit(`${r.name} ${r.abbr} ${r.db ?? ""} ${r.note}`)) }))
    .filter((grp) => grp.rows.length > 0);
  const tierB1 = g.tierB1
    .map((grp) => ({ ...grp, rows: grp.rows.filter((r) => hit(`${r.name} ${r.abbr} ${r.db ?? ""} ${r.note}`)) }))
    .filter((grp) => grp.rows.length > 0);
  const domestic = g.basicCatalog.domestic.filter((r) => hit(`${r.name} ${r.db ?? ""} ${r.note}`));
  const basicText = hit(g.basicCatalog.text) ? g.basicCatalog.text : null;
  const recs = g.recommendations
    .map((t) => ({ ...t, items: t.items.filter((r) => hit(`${r.name} ${r.abbr} ${r.db ?? ""} ${r.note}`)) }))
    .filter((t) => t.items.length > 0);
  const caveats = g.caveats.filter((t) => hit(t));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8b4a4] bg-[#fdf3ef] px-4 py-3 text-xs text-[#a1452a] leading-relaxed">
        {g.disclaimer}（整理于 {g.updatedAt}）
      </div>

      <Section title="一、毕业要求速览（博士 / 硕士要发几篇）">
        <div className="overflow-x-auto rounded-xl border border-[#e8e4db]">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="bg-[#faf9f5] text-[#9a9590] text-xs">
                <th className="px-3 py-2 text-left font-medium w-16">学位</th>
                <th className="px-3 py-2 text-left font-medium">基本要求（双盲评阅）</th>
                <th className="px-3 py-2 text-left font-medium">公开评阅（可选，更严）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece4]">
              {quick.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-sm text-[#9a9590]">
                    没有匹配的内容
                  </td>
                </tr>
              )}
              {quick.map((r) => (
                <tr key={r.degree} className="align-top">
                  <td className="px-3 py-2 font-semibold text-[#c96442]">{r.degree}</td>
                  <td className="px-3 py-2 text-[#4a4540]">{r.basic}</td>
                  <td className="px-3 py-2 text-[#4a4540]">{r.publicReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="二、一类目录（13 本顶刊 · 补充检索信息）" count={tier1.length}>
        <p className="text-xs text-[#9a9590]">影响因子为近年公布值，仅供相对参考；投稿难度与备注为整理者判断。</p>
        <GuideTable rows={tier1} />
      </Section>

      <Section title="三、二类（A）目录（CCF A / 中科院 1 区 / 电子学会一类）" count={tierA1.length}>
        <div className="space-y-4">
          {tierA1.length === 0 && <Item tone="note">没有匹配的条目</Item>}
          {tierA1.map((grp) => (
            <div key={grp.title}>
              <h3 className="text-sm font-semibold text-[#c96442] mb-2">{grp.title}</h3>
              <GuideTable rows={grp.rows} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="四、二类（B）目录（CCF B / 电子学会 T1 / 中科院 2 区）" count={tierB1.length}>
        <div className="space-y-4">
          {tierB1.length === 0 && <Item tone="note">没有匹配的条目</Item>}
          {tierB1.map((grp) => (
            <div key={grp.title}>
              <h3 className="text-sm font-semibold text-[#c96442] mb-2">{grp.title}</h3>
              <GuideTable rows={grp.rows} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="五、基本目录（CSCD / SCI / EI）" count={domestic.length}>
        <div className="space-y-3">
          {basicText && <Item>{basicText}</Item>}
          <div>
            <h3 className="text-sm font-semibold text-[#c96442] mb-2">中文期刊路径（成本低、周期可控）</h3>
            <GuideTable rows={domestic} />
          </div>
        </div>
      </Section>

      <Section title="六、结合研究方向（FPGA / EDA / ECO）的推荐选刊清单" count={recs.length}>
        <div className="space-y-4">
          {recs.length === 0 && <Item tone="note">没有匹配的条目</Item>}
          {recs.map((t) => (
            <div key={t.tier}>
              <h3 className="text-sm font-semibold text-[#c96442] mb-0.5">{t.tier}</h3>
              <p className="text-xs text-[#9a9590] mb-2">{t.purpose}</p>
              <GuideTable rows={t.items} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="七、关键说明与口径提示" count={caveats.length}>
        <ol className="space-y-2">
          {caveats.length === 0 && <Item tone="note">没有匹配的说明</Item>}
          {caveats.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#4a4540] leading-relaxed">
              <span className="shrink-0 text-[#9a9590]">{i + 1}.</span>
              <span className="flex-1">{t}</span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

export default function DegreeRequirements() {
  const [view, setView] = useState<"official" | "guide">("official");
  const [active, setActive] = useState(disciplines[0].id);
  const [q, setQ] = useState("");

  const d = disciplines.find((x) => x.id === active) ?? disciplines[0];

  const views = [
    { id: "official" as const, label: "学院原文要求" },
    { id: "guide" as const, label: "选刊手册（集成电路）" },
  ];

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
            <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">学位要求</h1>
            <p className="text-sm text-[#6b6560] mt-1">
              国防科技大学计算机学院 · 学位授予与评阅要求及紧密相关成果范围目录
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              view === v.id
                ? "bg-[#c96442] text-white shadow-sm"
                : "border border-[#e8e4db] bg-white text-[#6b6560] hover:border-[#c96442]/40"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "official" && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {disciplines.map((x) => (
            <button
              key={x.id}
              onClick={() => setActive(x.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                active === x.id
                  ? "bg-[#c96442] text-white shadow-sm"
                  : "border border-[#e8e4db] bg-white text-[#6b6560] hover:border-[#c96442]/40"
              }`}
            >
              {x.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5">
        <Search size={15} className="text-[#9a9590] shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="检索关键词，如：公开评阅、Nature、专利、折算、预警名单、FPGA、TCAD"
          className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#b5b0aa]"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-[#9a9590] hover:text-[#c96442]" title="清除">
            <X size={15} />
          </button>
        )}
      </div>

      {view === "official" ? (
        <>
          <div className="mb-6 rounded-xl border border-[#e8e4db] bg-[#faf9f5] px-4 py-3 text-xs text-[#6b6560] leading-relaxed flex items-start gap-2">
            <BookOpen size={14} className="shrink-0 mt-0.5 text-[#c96442]" />
            <span>
              依据学院《学位授予工作参考资料》原文整理，条款编号与措辞保持一致。目录（CCF / 中科院分区等）按官方发布情况动态调整，
              <b>紧密相关成果认定以申请学位时的目录版本为准</b>；标黄处为原文疑似笔误，实际执行请以学院解释为准。
            </span>
          </div>

          <DisciplineView key={d.id} d={d} q={q} />
        </>
      ) : (
        <GuideView g={venueGuide} q={q} />
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-[#9a9590]">
        <FileText size={13} />
        <span>如需正式文件，请以学院发布的《学位授予工作参考资料》原件为准</span>
      </div>
    </div>
  );
}
