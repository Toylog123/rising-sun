import { useEffect, useState } from "react";
import { X, Plus, Pencil, AlertCircle, GraduationCap, Users, Sparkles, Check } from "lucide-react";
import { useTaskStore, type Task } from "@/store/tasks";
import Combobox from "./Combobox";

interface TaskEditorProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}

export default function TaskEditor({ open, task, onClose }: TaskEditorProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const members = useTaskStore((s) => s.members);
  const tasks = useTaskStore((s) => s.tasks);
  const globalAdvisor = useTaskStore((s) => s.advisor);

  const [title, setTitle] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [pendingPick, setPendingPick] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setAdvisor(task.advisor ?? globalAdvisor);
    setAssignees([...task.assignees]);
    setPendingPick("");
    setCreatedAt(task.createdAt);
    setError("");
  }, [open, task, globalAdvisor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  const faculty = advisor ? [advisor] : [];
  const studentNames = Array.from(
    new Set([...members.filter((m) => m.role !== "teacher").map((m) => m.name), ...tasks.flatMap((t) => t.assignees)])
  ).filter((n) => n !== advisor && n !== "多人任务");
  const common = ["多人任务"];

  const remainingStudents = studentNames.filter((n) => !assignees.includes(n));
  const remainingCommon = common.filter((n) => !assignees.includes(n));

  const addAssignee = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || assignees.includes(trimmed)) return;
    setAssignees([...assignees, trimmed]);
    setPendingPick("");
  };
  const removeAssignee = (name: string) => {
    setAssignees(assignees.filter((a) => a !== name));
  };

  const submit = () => {
    if (!title.trim()) {
      setError("请填写任务标题");
      return;
    }
    if (assignees.length === 0) {
      setError("请至少选择一位成员");
      return;
    }
    updateTask(task.id, {
      title: title.trim(),
      assignees,
      advisor: advisor.trim() || undefined,
      createdAt,
    });
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
        className="relative w-full max-w-2xl rounded-2xl bg-white border border-[#e8e4db] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#c96442] text-white">
              <Pencil size={14} />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#1a1a1a]">编辑任务</h2>
          </div>
          <button onClick={onClose} className="text-[#9a9590] hover:text-[#1a1a1a]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={label}>任务标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：修改论文 / 构思课题方向"
              className={field}
              autoFocus
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={14} className="text-[#c96442]" />
                指导老师
              </span>
            </label>
            <Combobox
              value={advisor}
              onChange={setAdvisor}
              placeholder="选择或输入老师姓名"
              groups={[{ label: "🎓 指导老师", icon: <Sparkles size={11} />, options: faculty }]}
              allowCustom
            />
          </div>

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-[#c96442]" />
                成员
                <span className="ml-1 text-xs font-normal text-[#9a9590]">（{assignees.length} 位）</span>
              </span>
            </label>

            {assignees.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5 rounded-xl bg-[#faf9f5] border border-[#e8e4db] p-2.5">
                {assignees.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-full bg-[#c96442]/10 border border-[#c96442]/20 px-2.5 py-1 text-sm font-medium text-[#c96442]"
                  >
                    <Check size={12} />
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAssignee(a)}
                      className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-[#c96442]/20 transition-colors"
                      title="移除"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Combobox
              value={pendingPick}
              onChange={(v) => {
                if (pendingPick && v !== pendingPick && !assignees.includes(v)) {
                  addAssignee(v);
                } else {
                  setPendingPick(v);
                }
              }}
              placeholder="点击 ▼ 查看候选，或输入名字添加"
              groups={[
                ...(remainingStudents.length > 0
                  ? [{ label: "👥 组员", icon: <Users size={11} />, options: remainingStudents }]
                  : []),
                ...(remainingCommon.length > 0 ? [{ label: "📌 其他", options: remainingCommon }] : []),
              ]}
              allowCustom
            />
          </div>

          <div>
            <label className={label}>创建时间</label>
            <input
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
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