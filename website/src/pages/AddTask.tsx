import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, GraduationCap, Users, Sparkles, X, Check } from "lucide-react";
import { useTaskStore, todayStr, STATUS_OPTIONS } from "@/store/tasks";
import Combobox from "@/components/Combobox";

export default function AddTask() {
  const navigate = useNavigate();
  const addTask = useTaskStore((s) => s.addTask);
  const advisor = useTaskStore((s) => s.advisor);
  const members = useTaskStore((s) => s.members);
  const tasks = useTaskStore((s) => s.tasks);

  const faculty = advisor ? [advisor] : [];
  const studentNames = Array.from(
    new Set([...members.map((m) => m.name), ...tasks.flatMap((t) => t.assignees)])
  ).filter((n) => n !== advisor && n !== "多人任务");
  const common = ["多人任务"];

  const [taskAdvisor, setTaskAdvisor] = useState(advisor || "");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [pendingPick, setPendingPick] = useState("");
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState(todayStr());
  const [status, setStatus] = useState("进行中");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

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
    if (!taskAdvisor.trim() || assignees.length === 0 || !title.trim() || !createdAt) {
      setError("请填写指导老师、协同成员（至少 1 位）、任务标题和创建时间");
      return;
    }
    addTask({
      advisor: taskAdvisor.trim(),
      assignees,
      title: title.trim(),
      createdAt,
      status,
      note: note.trim() || undefined,
    });
    navigate(`/tasks`);
  };

  const label = "block text-sm font-medium text-ink mb-1.5";
  const field =
    "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-faint outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/10";

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft size={15} /> 返回
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent text-white shadow-brand">
          <Plus size={16} />
        </div>
        <h1 className="font-serif text-2xl font-bold text-ink">新建任务</h1>
      </div>

      <div className="rounded-2xl bg-paper border border-line p-6 space-y-5">
        <div>
          <label className={label}>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={14} className="text-accent" />
              指导老师
            </span>
          </label>
          <Combobox
            value={taskAdvisor}
            onChange={setTaskAdvisor}
            placeholder="选择或输入老师姓名"
            groups={[{ label: "🎓 指导老师", icon: <Sparkles size={11} />, options: faculty }]}
            allowCustom
          />
          <p className="mt-1.5 text-xs text-faint">
            当前课题组指导老师：{advisor || "未设置"}
          </p>
        </div>

        <div>
          <label className={label}>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-accent" />
              协同成员
              <span className="ml-1 text-xs font-normal text-faint">
                （{assignees.length} 位）
              </span>
            </span>
          </label>

          {assignees.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5 rounded-xl bg-paper border border-line p-2.5">
              {assignees.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-sm font-medium text-accent"
                >
                  <Check size={12} />
                  {a}
                  <button
                    type="button"
                    onClick={() => removeAssignee(a)}
                    className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-accent/20 transition-colors"
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
            onChange={setPendingPick}
            onSelect={addAssignee}
            placeholder="点击 ▼ 查看候选，或输入名字添加"
            groups={[
              ...(remainingStudents.length > 0
                ? [{ label: "👥 组员", icon: <Users size={11} />, options: remainingStudents }]
                : []),
              ...(remainingCommon.length > 0 ? [{ label: "📌 其他", options: remainingCommon }] : []),
            ]}
            allowCustom
          />
          <p className="mt-1.5 text-xs text-faint">
            提示：可多次添加（每位成员都是协同成员，任意一位可添加进展）
          </p>
        </div>

        <div>
          <label className={label}>任务标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：修改论文 / 构思课题方向"
            className={field}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>创建时间</label>
            <input
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={label}>初始状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={field}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>备注（可选）</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：下次组会汇报"
            className={field}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-danger-line bg-danger-wash p-3 text-sm text-danger-ink">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:bg-accent-deep"
        >
          创建任务
        </button>
      </div>
    </div>
  );
}