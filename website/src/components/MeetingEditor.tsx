import { useEffect, useState } from "react";
import { X, Plus, Pencil, AlertCircle, Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import { useMeetingStore, type Meeting } from "@/store/meetings";
import { useTaskStore } from "@/store/tasks";
import { confirmDialog } from "@/store/ui";
import Combobox from "./Combobox";

interface MeetingEditorProps {
  open: boolean;
  initial?: Meeting | null;
  onClose: () => void;
}

export default function MeetingEditor({ open, initial, onClose }: MeetingEditorProps) {
  const addMeeting = useMeetingStore((s) => s.addMeeting);
  const updateMeeting = useMeetingStore((s) => s.updateMeeting);
  const removeMeeting = useMeetingStore((s) => s.removeMeeting);

  const isEdit = Boolean(initial);

  const members = useTaskStore((s) => s.members);
  const memberNames = Array.from(
    new Set(members.filter((m) => m.role !== "teacher").map((m) => m.name))
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));

  const [date, setDate] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [decisions, setDecisions] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setDate(initial.date);
      setSpeaker(initial.speaker);
      setTopic(initial.topic);
      setNotes(initial.notes ?? "");
      setDecisions(initial.decisions ?? "");
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setSpeaker("");
      setTopic("");
      setNotes("");
      setDecisions("");
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
    if (!date) {
      setError("请选择日期");
      return;
    }
    if (!speaker.trim()) {
      setError("请填写主讲人");
      return;
    }
    if (!topic.trim()) {
      setError("请填写议题/标题");
      return;
    }
    if (isEdit && initial) {
      updateMeeting(initial.id, {
        date,
        speaker: speaker.trim(),
        topic: topic.trim(),
        notes: notes.trim() || undefined,
        decisions: decisions.trim() || undefined,
      });
    } else {
      addMeeting({
        date,
        speaker: speaker.trim(),
        topic: topic.trim(),
        notes: notes.trim() || undefined,
        decisions: decisions.trim() || undefined,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!initial) return;
    const ok = await confirmDialog({
      title: `删除组会记录「${initial.topic}」？`,
      description: `${initial.date} · 主讲人 ${initial.speaker}`,
      confirmText: "删除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    removeMeeting(initial.id);
    onClose();
  };

  const field =
    "w-full rounded-xl border border-[#e8e4db] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10";
  const label = "block text-sm font-medium text-[#1a1a1a] mb-1.5";
  const areaCls = `${field} min-h-[80px] resize-y leading-relaxed`;

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
              {isEdit ? "编辑组会记录" : "新增组会记录"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#9a9590] hover:text-[#1a1a1a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#c96442]" />
                  组会日期
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} className="text-[#c96442]" />
                  主讲人
                </span>
              </label>
              <Combobox
                value={speaker}
                onChange={setSpeaker}
                placeholder="选择主讲学生"
                groups={[{ label: "👥 主讲学生", icon: <User size={11} />, options: memberNames }]}
                allowCustom={false}
              />
            </div>
          </div>

          <div>
            <label className={label}>议题 / 标题</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：修改论文进展 / 构思课题方向"
              className={field}
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} className="text-[#c96442]" />
                纪要（可选）
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="讨论了哪些内容、有什么观点…"
              className={areaCls}
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#c96442]" />
                决议（可选）
              </span>
            </label>
            <textarea
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              placeholder="下一步要做什么、何时完成"
              className={areaCls}
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