import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, GraduationCap, User } from "lucide-react";
import { useTaskStore, todayStr, STATUS_OPTIONS } from "@/store/tasks";

export default function AddTask() {
  const navigate = useNavigate();
  const addTask = useTaskStore((s) => s.addTask);
  const seedMembers = useTaskStore((s) => s.members);
  const advisor = useTaskStore((s) => s.advisor);
  const tasks = useTaskStore((s) => s.tasks);

  // 老师 + 学生 + 任务中出现过的 assignee + 共同任务
  const faculty = advisor ? [advisor] : [];
  const students = Array.from(
    new Set([
      ...seedMembers,
      ...tasks.map((t) => t.assignee),
    ])
  ).filter((n) => n !== advisor && n !== "共同任务");
  const common = ["共同任务"];
  const allAssignees = [...faculty, ...students, ...common];

  const [assignee, setAssignee] = useState(allAssignees[0] || "");
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState(todayStr());
  const [status, setStatus] = useState("进行中");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!assignee.trim() || !title.trim() || !createdAt) {
      setError("请填写负责人、任务标题和创建时间");
      return;
    }
    addTask({ assignee: assignee.trim(), title: title.trim(), createdAt, status, note: note.trim() || undefined });
    navigate(`/tasks?member=${encodeURIComponent(assignee.trim())}`);
  };

  const field = "w-full rounded-xl border border-[#e8e4db] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10";
  const label = "block text-sm font-medium text-[#1a1a1a] mb-1.5";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[#6b6560] hover:text-[#c96442] transition-colors mb-6">
        <ArrowLeft size={15} /> 返回
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
          <Plus size={16} />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">新建任务</h1>
      </div>

      <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 space-y-5">
        <div>
          <label className={label}>负责人</label>
          <input list="members" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="选择或输入成员名（可新增）" className={field} />
          <datalist id="members">
            {faculty.length > 0 && (
              <optgroup label="🎓 指导老师">
                {faculty.map((m) => <option key={m} value={m} />)}
              </optgroup>
            )}
            {students.length > 0 && (
              <optgroup label="👥 组员">
                {students.map((m) => <option key={m} value={m} />)}
              </optgroup>
            )}
            <optgroup label="📌 其他">
              {common.map((m) => <option key={m} value={m} />)}
            </optgroup>
          </datalist>
          <p className="mt-1.5 text-xs text-[#9a9590]">提示：可以直接输入新名字，会自动加入组员列表</p>
        </div>

        <div>
          <label className={label}>任务标题</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：修改论文 / 构思课题方向" className={field} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>创建时间</label>
            <input type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>初始状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>备注（可选）</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：下次组会汇报" className={field} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button onClick={submit} className="w-full rounded-xl bg-[#c96442] px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-[#c96442]/20 transition-all hover:bg-[#b5573a]">
          创建任务
        </button>
      </div>
    </div>
  );
}
