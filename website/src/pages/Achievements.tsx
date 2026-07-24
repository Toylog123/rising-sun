import { useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, BookOpen, Lightbulb, Trophy, Award, ExternalLink,
  Calendar, FileText, Link2, Users, GraduationCap,
} from "lucide-react";
import {
  useAchievementStore, type Achievement, type AchievementCategory,
  type PaperAchievement, type PatentAchievement, type CompetitionAchievement,
} from "@/store/achievements";
import AchievementEditor from "@/components/AchievementEditor";

const CATEGORY_META: Record<
  AchievementCategory,
  { icon: typeof BookOpen; color: string; bg: string; ring: string; title: string }
> = {
  论文: {
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    title: "论文",
  },
  专利: {
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    title: "专利",
  },
  比赛: {
    icon: Trophy,
    color: "text-[#c96442]",
    bg: "bg-[#c96442]/10",
    ring: "ring-[#c96442]/30",
    title: "比赛获奖",
  },
};

function PaperCard({ a, onEdit, onRemove }: { a: PaperAchievement; onEdit: () => void; onRemove: () => void }) {
  const meta = CATEGORY_META.论文;
  const Icon = meta.icon;
  return (
    <article className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center ${meta.bg} ${meta.color} ${meta.ring}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${meta.bg} ${meta.color} ${meta.ring}`}>
                  论文
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[#6b6560]">
                  <Calendar size={11} />
                  {a.year}
                </span>
                <span className="text-xs text-[#6b6560]">· {a.venue}</span>
                {a.jcr && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                    JCR {a.jcr}
                  </span>
                )}
                {a.cas && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
                    中科院 {a.cas}
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 font-serif text-base font-semibold text-[#1a1a1a] leading-snug">
                {a.title}
              </h3>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                <Users size={11} />
                {a.authors.join("、")}
                {a.correspondingAuthors && a.correspondingAuthors.length > 0 && (
                  <span className="ml-1 text-[#c96442]">（通讯：{a.correspondingAuthors.join("、")}）</span>
                )}
              </p>
              {a.note && <p className="mt-1 text-xs text-[#9a9590]">{a.note}</p>}
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[#c96442] hover:text-[#b5573a] transition-colors"
                >
                  <ExternalLink size={11} />
                  查看链接
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} title="编辑" className="p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={onRemove} title="删除" className="p-1.5 rounded-md text-[#6b6560] hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function PatentCard({ a, onEdit, onRemove }: { a: PatentAchievement; onEdit: () => void; onRemove: () => void }) {
  const meta = CATEGORY_META.专利;
  const Icon = meta.icon;
  return (
    <article className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center ${meta.bg} ${meta.color} ${meta.ring}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${meta.bg} ${meta.color} ${meta.ring}`}>
                  专利
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[#6b6560]">
                  <Calendar size={11} />
                  {a.year}
                </span>
                {a.status && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                    {a.status}
                  </span>
                )}
                {a.patentNo && (
                  <span className="text-xs text-[#6b6560] font-mono">{a.patentNo}</span>
                )}
              </div>
              <h3 className="mt-1.5 font-serif text-base font-semibold text-[#1a1a1a] leading-snug">
                {a.name}
              </h3>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                <Users size={11} />
                发明人：{a.authors.join("、")}
              </p>
              {a.note && <p className="mt-1 text-xs text-[#9a9590]">{a.note}</p>}
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[#c96442] hover:text-[#b5573a] transition-colors"
                >
                  <ExternalLink size={11} />
                  查看专利
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} title="编辑" className="p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={onRemove} title="删除" className="p-1.5 rounded-md text-[#6b6560] hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompetitionCard({ a, onEdit, onRemove }: { a: CompetitionAchievement; onEdit: () => void; onRemove: () => void }) {
  const meta = CATEGORY_META.比赛;
  const Icon = meta.icon;
  return (
    <article className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center ${meta.bg} ${meta.color} ${meta.ring}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${meta.bg} ${meta.color} ${meta.ring}`}>
                  比赛
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[#6b6560]">
                  <Calendar size={11} />
                  {a.year}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#c96442] text-white text-xs font-bold">
                  {a.award}
                </span>
              </div>
              <h3 className="mt-1.5 font-serif text-base font-semibold text-[#1a1a1a] leading-snug">
                {a.competition}
              </h3>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                <Users size={11} />
                获奖成员：{a.authors.join("、")}
              </p>
              {a.advisors && a.advisors.length > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                  <GraduationCap size={11} />
                  指导老师：{a.advisors.join("、")}
                </p>
              )}
              {a.note && <p className="mt-1 text-xs text-[#9a9590]">{a.note}</p>}
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[#c96442] hover:text-[#b5573a] transition-colors"
                >
                  <ExternalLink size={11} />
                  查看比赛
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} title="编辑" className="p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={onRemove} title="删除" className="p-1.5 rounded-md text-[#6b6560] hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const CATEGORY_ORDER: AchievementCategory[] = ["论文", "专利", "比赛"];

export default function Achievements() {
  const achievements = useAchievementStore((s) => s.achievements);
  const pull = useAchievementStore((s) => s.pull);
  const removeAchievement = useAchievementStore((s) => s.removeAchievement);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);

  // 按类别 + 年份倒序
  const grouped = useMemo(() => {
    const result: Record<AchievementCategory, Achievement[]> = { 论文: [], 专利: [], 比赛: [] };
    for (const a of achievements) {
      result[a.category].push(a);
    }
    for (const cat of CATEGORY_ORDER) {
      result[cat].sort((a, b) => b.year.localeCompare(a.year));
    }
    return result;
  }, [achievements]);

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (a: Achievement) => {
    setEditing(a);
    setEditorOpen(true);
  };
  const handleRemove = (a: Achievement) => {
    if (!confirm(`确定删除该${a.category}？`)) return;
    removeAchievement(a.id);
  };

  const counts = CATEGORY_ORDER.map((c) => ({ cat: c, n: grouped[c].length })).filter((x) => x.n > 0);
  const total = achievements.length;

  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf9f5] via-[#f5f0e6] to-[#f0ece4]">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #c96442 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#c96442] text-white">
                <Award size={20} />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">课题组成果</h1>
                <p className="text-sm text-[#6b6560] mt-1">论文 · 专利 · 比赛获奖 · 共 {total} 项</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pull()}
                className="rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 transition-colors"
              >
                刷新
              </button>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
              >
                <Plus size={15} />
                新增成果
              </button>
            </div>
          </div>
          {counts.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {counts.map(({ cat, n }) => {
                const meta = CATEGORY_META[cat];
                const Icon = meta.icon;
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${meta.bg} ${meta.color} ${meta.ring}`}
                  >
                    <Icon size={12} />
                    {cat} {n}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {total === 0 ? (
          <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-16 text-center">
            <Award size={32} className="mx-auto text-[#9a9590]" />
            <p className="mt-3 text-sm text-[#6b6560]">还没有成果记录</p>
            <p className="mt-1 text-xs text-[#9a9590]">课题组 2025 年成立，添加新成果时点"新增成果"</p>
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={15} />
              添加第一个成果
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {CATEGORY_ORDER.map((cat) => {
              const list = grouped[cat];
              if (list.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <section key={cat}>
                  <h2 className="font-serif text-lg font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                    <Icon size={18} className={meta.color} />
                    {meta.title}
                    <span className={`text-xs font-normal ${meta.color}`}>· {list.length} 项</span>
                  </h2>
                  <div className="space-y-3">
                    {list.map((a) => {
                      if (a.category === "论文") return <PaperCard key={a.id} a={a} onEdit={() => openEdit(a)} onRemove={() => handleRemove(a)} />;
                      if (a.category === "专利") return <PatentCard key={a.id} a={a} onEdit={() => openEdit(a)} onRemove={() => handleRemove(a)} />;
                      return <CompetitionCard key={a.id} a={a} onEdit={() => openEdit(a)} onRemove={() => handleRemove(a)} />;
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs text-[#9a9590]">
          提示：仅收录 2025 年课题组成立以来的成果。任何写入都会自动同步到 GitHub 仓库的 <code>achievements.json</code>。
        </p>
      </section>

      <AchievementEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}