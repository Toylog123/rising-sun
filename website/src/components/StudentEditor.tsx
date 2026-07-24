import { useEffect, useState } from "react";
import { X, Plus, Pencil, AlertCircle, GraduationCap, User, Calendar } from "lucide-react";
import { useTaskStore, type Student, type StudentStatus, type MemberRole } from "@/store/tasks";
import { STUDENT_STATUS_OPTIONS } from "@/lib/students";

interface StudentEditorProps {
  open: boolean;
  initial?: Student | null;
  onClose: () => void;
}

export default function StudentEditor({ open, initial, onClose }: StudentEditorProps) {
  const globalAdvisor = useTaskStore((s) => s.advisor);
  const members = useTaskStore((s) => s.members);
  const addStudent = useTaskStore((s) => s.addStudent);
  const updateStudent = useTaskStore((s) => s.updateStudent);

  const isEdit = Boolean(initial);

  const [role, setRole] = useState<MemberRole>("student");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [enrolledAt, setEnrolledAt] = useState("");
  const [status, setStatus] = useState<StudentStatus>("在读");
  const [bio, setBio] = useState("");
  const [note, setNote] = useState("");
  const [advisor, setAdvisor] = useState(globalAdvisor);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setRole(initial.role ?? "student");
      setName(initial.name);
      setTitle(initial.title ?? "");
      setEnrolledAt(initial.enrolledAt ?? "");
      setStatus(initial.status ?? "在读");
      setBio(initial.bio ?? "");
      setNote(initial.note ?? "");
      setAdvisor(initial.advisor ?? globalAdvisor);
    } else {
      setRole("student");
      setName("");
      setTitle("");
      setEnrolledAt("");
      setStatus("在读");
      setBio("");
      setNote("");
      setAdvisor(globalAdvisor);
    }
    setError("");
  }, [open, initial, globalAdvisor]);

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
    const n = name.trim();
    if (!n) {
      setError("请填写姓名");
      return;
    }
    if (!isEdit && members.some((m) => m.name === n)) {
      setError("已存在同名成员");
      return;
    }
    if (role === "student") {
      if (!enrolledAt) {
        setError("请填写入校时间");
        return;
      }
      if (!/^\d{4}-\d{2}$/.test(enrolledAt)) {
        setError("入校时间格式应为 YYYY-MM");
        return;
      }
    }
    const baseData = {
      name: n,
      role,
      enrolledAt: enrolledAt || undefined,
      status: role === "teacher" ? undefined : status,
      title: role === "teacher" ? title.trim() || undefined : undefined,
      bio: bio.trim() || undefined,
      note: note.trim() || undefined,
      advisor: advisor || undefined,
    };
    if (isEdit && initial) {
      updateStudent(initial.name, baseData);
    } else {
      addStudent(baseData);
    }
    onClose();
  };

  const field =
    "w-full rounded-xl border border-[#e8e4db] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10";
  const label = "block text-sm font-medium text-[#1a1a1a] mb-1.5";
  const areaCls = `${field} min-h-[60px] resize-y leading-relaxed`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
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
              {isEdit ? "编辑成员" : "添加成员"}
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
          {!isEdit && (
            <div>
              <label className={label}>身份</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    role === "student"
                      ? "bg-[#c96442] text-white border-[#c96442]"
                      : "bg-white text-[#6b6560] border-[#e8e4db] hover:border-[#c96442]/40"
                  }`}
                >
                  <User size={14} />
                  学生
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    role === "teacher"
                      ? "bg-[#c96442] text-white border-[#c96442]"
                      : "bg-white text-[#6b6560] border-[#e8e4db] hover:border-[#c96442]/40"
                  }`}
                >
                  <GraduationCap size={14} />
                  老师
                </button>
              </div>
            </div>
          )}

          <div>
            <label className={label}>姓名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === "teacher" ? "例如：刘畅" : "例如：周雨时"}
              className={field}
              disabled={isEdit}
              autoFocus={!isEdit}
            />
            {isEdit && (
              <p className="mt-1 text-xs text-[#9a9590]">姓名为唯一标识，不支持修改</p>
            )}
          </div>

          {role === "teacher" ? (
            <div>
              <label className={label}>职称</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：副教授 / 教授 / 讲师"
                className={field}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#c96442]" />
                    入校时间
                  </span>
                </label>
                <input
                  type="month"
                  value={enrolledAt}
                  onChange={(e) => setEnrolledAt(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={label}>状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StudentStatus)}
                  className={field}
                >
                  {STUDENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={label}>简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={role === "teacher" ? "例如：研究方向、职务、获奖、邮箱" : "例如：研究方向、入校年份、年级"}
              className={areaCls}
            />
          </div>

          <div>
            <label className={label}>备注（可选）</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：研究方向 / 课题方向"
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
