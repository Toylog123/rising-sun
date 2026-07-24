import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useTaskStore, type Student } from "@/store/tasks";
import { calcGrade, statusToneStudent } from "@/lib/students";
import StudentEditor from "@/components/StudentEditor";

const TONE_BG: Record<string, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: "bg-[#f0ece4] text-[#6b6560] border-[#e8e4db]",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function Students() {
  const advisor = useTaskStore((s) => s.advisor);
  const members = useTaskStore((s) => s.members);
  const removeStudent = useTaskStore((s) => s.removeStudent);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  // 自定义顺序：佟亚龙固定第一，其他人按拼音 zh-CN 排序
  const sorted = [...members].sort((a, b) => {
    if (a.name === "佟亚龙") return -1;
    if (b.name === "佟亚龙") return 1;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  const total = members.length;
  const active = members.filter((m) => m.status === "在读").length;
  const alumni = members.filter((m) => m.status === "已毕业").length;

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditing(s);
    setEditorOpen(true);
  };
  const handleRemove = (s: Student) => {
    if (!confirm(`确定移除「${s.name}」？仅删除成员档案，不影响已存在任务。`)) return;
    removeStudent(s.name);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#c96442] text-white">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">学生</h1>
            <p className="text-sm text-[#6b6560] mt-1">
              管理课题组成员档案 · 当前指导老师：<span className="font-medium text-[#1a1a1a]">{advisor || "—"}</span>
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
        >
          <Plus size={15} />
          添加学生
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-[#e8e4db] px-4 py-3">
          <div className="text-xs text-[#6b6560]">总人数</div>
          <div className="mt-1 text-xl font-semibold text-[#1a1a1a]">{total}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#e8e4db] px-4 py-3">
          <div className="text-xs text-[#6b6560]">在读</div>
          <div className="mt-1 text-xl font-semibold text-green-700">{active}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#e8e4db] px-4 py-3">
          <div className="text-xs text-[#6b6560]">已毕业</div>
          <div className="mt-1 text-xl font-semibold text-[#6b6560]">{alumni}</div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-16 text-center">
          <Users size={32} className="mx-auto text-[#9a9590]" />
          <p className="mt-3 text-sm text-[#6b6560]">还没有学生档案</p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={15} />
            添加第一个学生
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#e8e4db] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#faf9f5] border-b border-[#e8e4db]">
                <tr className="text-xs text-[#6b6560]">
                  <th className="px-4 py-3 text-left font-medium">姓名</th>
                  <th className="px-4 py-3 text-left font-medium">指导老师</th>
                  <th className="px-4 py-3 text-left font-medium">入校时间</th>
                  <th className="px-4 py-3 text-left font-medium">当前年级</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">备注</th>
                  <th className="px-4 py-3 text-right font-medium w-24">操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const grade = calcGrade(s.enrolledAt);
                  const tone = statusToneStudent(s.status);
                  return (
                    <tr
                      key={s.name}
                      className={i > 0 ? "border-t border-[#f0ece4]" : ""}
                    >
                      <td className="px-4 py-3 font-medium text-[#1a1a1a]">{s.name}</td>
                      <td className="px-4 py-3 text-[#4a4540]">{s.advisor ?? advisor ?? "—"}</td>
                      <td className="px-4 py-3 text-[#4a4540] font-mono text-xs">
                        {s.enrolledAt || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {s.enrolledAt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#faf9f5] border border-[#e8e4db] text-[#1a1a1a] font-medium text-xs">
                            {grade.label}
                          </span>
                        ) : (
                          <span className="text-[#9a9590]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${TONE_BG[tone] ?? TONE_BG.gray}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6b6560] max-w-xs truncate">{s.note || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            title="编辑"
                            className="p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRemove(s)}
                            title="移除"
                            className="p-1.5 rounded-md text-[#6b6560] hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-[#9a9590]">
        提示：年级根据入校时间按学年自动计算（每年 9 月起算）。任何写入都会同步到 GitHub 仓库的 <code>tasks.json</code>。
      </p>

      <StudentEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}