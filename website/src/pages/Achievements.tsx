import { useState } from "react";
import { Plus, Pencil, Award, Trophy, BookOpen, Lightbulb, FileText, Calendar, ExternalLink, Users, Trash2 } from "lucide-react";
import { useAchievementStore, type Achievement, type AchievementType } from "@/store/achievements";
import AchievementEditor from "@/components/AchievementEditor";

const TYPE_META: Record<AchievementType, { icon: typeof Award; color: string; bg: string }> = {
  论文: { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  专利: { icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  比赛: { icon: Trophy, color: "text-[#c96442]", bg: "bg-[#c96442]/10 border-[#c96442]/30" },
  项目: { icon: FileText, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  获奖: { icon: Award, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
};

export default function Achievements() {
  const achievements = useAchievementStore((s) => s.achievements);
  const pull = useAchievementStore((s) => s.pull);
  const removeAchievement = useAchievementStore((s) => s.removeAchievement);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);

  const sorted = [...achievements].sort((a, b) => b.date.localeCompare(a.date));

  const counts = sorted.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (a: Achievement) => {
    setEditing(a);
    setEditorOpen(true);
  };
  const handleRemove = (a: Achievement) => {
    if (!confirm(`确定删除「${a.title}」？`)) return;
    removeAchievement(a.id);
  };

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
                <Trophy size={20} />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">课题组成果</h1>
                <p className="text-sm text-[#6b6560] mt-1">
                  论文 · 专利 · 比赛 · 项目 · 获奖 · 共 {achievements.length} 项
                </p>
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
          <p className="mt-4 text-[15px] text-[#4a4540] leading-relaxed max-w-2xl">
            收录课题组自 2025 年成立以来的研究产出，包括论文、专利、科研项目与学科竞赛获奖等。
          </p>
          {Object.keys(counts).length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(counts).map(([type, count]) => {
                const meta = TYPE_META[type as AchievementType];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${meta.bg} ${meta.color}`}
                  >
                    <Icon size={12} />
                    {type} {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {sorted.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-16 text-center">
            <Trophy size={32} className="mx-auto text-[#9a9590]" />
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
          <div className="space-y-3">
            {sorted.map((a) => {
              const meta = TYPE_META[a.type];
              const Icon = meta.icon;
              return (
                <article
                  key={a.id}
                  className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30"
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center ${meta.bg} ${meta.color}`}>
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${meta.bg} ${meta.color}`}>
                              {a.type}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-[#6b6560]">
                              <Calendar size={11} />
                              {a.date}
                            </span>
                            {a.venue && (
                              <span className="text-xs text-[#6b6560]">· {a.venue}</span>
                            )}
                          </div>
                          <h3 className="mt-1.5 font-serif text-base font-semibold text-[#1a1a1a] leading-snug">
                            {a.title}
                          </h3>
                          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                            <Users size={11} />
                            {a.authors.join("、")}
                          </p>
                          {a.note && (
                            <p className="mt-1 text-xs text-[#9a9590]">{a.note}</p>
                          )}
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
                          <button
                            onClick={() => openEdit(a)}
                            title="编辑"
                            className="p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRemove(a)}
                            title="删除"
                            className="p-1.5 rounded-md text-[#6b6560] hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
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