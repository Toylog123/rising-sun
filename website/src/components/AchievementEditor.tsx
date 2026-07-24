import { useEffect, useState } from "react";
import { X, Plus, Pencil, AlertCircle, Calendar, FileText, Link2, Users } from "lucide-react";
import { useAchievementStore, type Achievement, type AchievementType, ACHIEVEMENT_TYPE_OPTIONS } from "@/store/achievements";
import { confirmDialog } from "@/store/ui";

interface AchievementEditorProps {
  open: boolean;
  initial?: Achievement | null;
  onClose: () => void;
}

export default function AchievementEditor({ open, initial, onClose }: AchievementEditorProps) {
  const addAchievement = useAchievementStore((s) => s.addAchievement);
  const updateAchievement = useAchievementStore((s) => s.updateAchievement);
  const removeAchievement = useAchievementStore((s) => s.removeAchievement);

  const isEdit = Boolean(initial);

  const [type, setType] = useState<AchievementType>("论文");
  const [title, setTitle] = useState("");
  const [authorsText, setAuthorsText] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.type);
      setTitle(initial.title);
      setAuthorsText(initial.authors.join("、"));
      setDate(initial.date);
      setVenue(initial.venue ?? "");
      setLink(initial.link ?? "");
      setNote(initial.note ?? "");
    } else {
      setType("论文");
      setTitle("");
      setAuthorsText("");
      const today = new Date().toISOString().slice(0, 7);
      setDate(today);
      setVenue("");
      setLink("");
      setNote("");
    }
    setError("");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    if (!title.trim()) {
      setError("请填写标题");
      return;
    }
    if (!date) {
      setError("请选择日期");
      return;
    }
    const authors = authorsText
      .split(/[、,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (authors.length === 0) {
      setError("请至少填写一位作者");
      return;
    }
    const data = {
      type,
      title: title.trim(),
      authors,
      date,
      venue: venue.trim() || undefined,
      link: link.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (isEdit && initial) {
      updateAchievement(initial.id, data);
    } else {
      addAchievement(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!initial) return;
    const ok = await confirmDialog({
      title: `删除成果「${initial.title}」？`,
      description: `${initial.date} · ${initial.authors.join("、")}`,
      confirmText: "删除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    removeAchievement(initial.id);
    onClose();
  };

  const field =
    "w-full rounded-xl border border-[#e8e4db] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10";
  const label = "block text-sm font-medium text-[#1a1a1a] mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-[#e8e4db] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#c96442] text-white">
              {isEdit ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <h2 className="font-serif text-lg font-bold text-[#1a1a1a]">
              {isEdit ? "编辑成果" : "新增成果"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#9a9590] hover:text-[#1a1a1a]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>类型</label>
              <select value={type} onChange={(e) => setType(e.target.value as AchievementType)} className={field}>
                {ACHIEVEMENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#c96442]" />
                  日期
                </span>
              </label>
              <input
                type="month"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label}>标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：2024 EDA 精英挑战赛 · 全国一等奖"
              className={field}
              autoFocus={!isEdit}
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-[#c96442]" />
                作者（用 、 分隔）
              </span>
            </label>
            <input
              value={authorsText}
              onChange={(e) => setAuthorsText(e.target.value)}
              placeholder="例如：佟亚龙、刘畅"
              className={field}
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} className="text-[#c96442]" />
                发表场所（可选）
              </span>
            </label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="例如：DAC 2024 / 中国科学：信息科学"
              className={field}
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <Link2 size={14} className="text-[#c96442]" />
                链接（可选）
              </span>
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://doi.org/..."
              className={field}
            />
          </div>

          <div>
            <label className={label}>备注（可选）</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：导师一作 / 最佳论文奖"
              className={field}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#f0ece4] bg-[#faf9f5] flex items-center gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              删除
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
          >
            取消
          </button>
          <button
            onClick={submit}
            className="ml-auto rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}