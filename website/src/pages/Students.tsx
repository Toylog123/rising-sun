import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Users, Calendar, FlaskConical, GraduationCap,
  Mail, Github, ExternalLink, ArrowRight,
} from "lucide-react";
import { useTaskStore, latestStatus, statusTone, type Student } from "@/store/tasks";
import { calcGrade, statusToneStudent } from "@/lib/students";
import { confirmDialog } from "@/store/ui";
import StudentEditor from "@/components/StudentEditor";

const STATUS_BG: Record<string, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: "bg-[#f0ece4] text-[#6b6560] border-[#e8e4db]",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function Students() {
  const advisor = useTaskStore((s) => s.advisor);
  const members = useTaskStore((s) => s.members);
  const tasks = useTaskStore((s) => s.tasks);
  const removeStudent = useTaskStore((s) => s.removeStudent);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.name === "佟亚龙") return -1;
        if (b.name === "佟亚龙") return 1;
        return a.name.localeCompare(b.name, "zh-CN");
      }),
    [members]
  );

  const students = members.filter((m) => m.role !== "teacher");
  const teachers = members.filter((m) => m.role === "teacher");
  const total = students.length;
  const active = students.filter((m) => m.status === "在读").length;
  const alumni = students.filter((m) => m.status === "已毕业").length;

  const statOf = (name: string) => {
    const list = tasks.filter((t) => t.assignees.includes(name));
    const done = list.filter((t) => statusTone(latestStatus(t)) === "green").length;
    const active = list.filter((t) => statusTone(latestStatus(t)) === "amber").length;
    return { total: list.length, done, active };
  };

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditing(s);
    setEditorOpen(true);
  };
  const handleRemove = async (s: Student) => {
    const ok = await confirmDialog({
      title: `移除学生「${s.name}」？`,
      description: "仅删除成员档案，不影响已存在任务。",
      confirmText: "移除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    removeStudent(s.name);
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
                <Users size={20} />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">课题组成员</h1>
                <p className="text-sm text-[#6b6560] mt-1">
                  共 {total} 人 · 在读 {active} · 已毕业 {alumni} · 指导老师 {advisor || "—"}
                </p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
            >
              <Plus size={15} />
              添加成员
            </button>
          </div>
          <p className="mt-4 text-[15px] text-[#4a4540] leading-relaxed max-w-3xl">
            课题组由 1 位指导老师与 {active} 位在读研究生组成，研究方向涵盖芯片设计自动化、AI for EDA 与工程变更优化（ECO）。
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <div className="space-y-8">
            {/* 指导老师（顶部） */}
            {(() => {
              const teacher = sorted.find((m) => m.role === "teacher");
              if (!teacher) return null;
              return (
                <section>
                  <h2 className="font-serif text-lg font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-[#c96442]" />
                    指导老师
                  </h2>
                  <article
                    key={teacher.name}
                    className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">
                          {teacher.name}
                        </h3>
                        {teacher.title && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#c96442]/10 border border-[#c96442]/20 text-xs font-medium text-[#c96442]">
                            {teacher.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(teacher)}
                          title="编辑"
                          className="p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleRemove(teacher)}
                          title="移除"
                          className="p-1.5 rounded-md text-[#6b6560] hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {teacher.researchAreas && teacher.researchAreas.length > 0 && (
                      <div className="mt-3">
                        <p className="flex items-center gap-1 text-xs font-semibold text-[#9a9590] mb-1.5">
                          <FlaskConical size={12} />
                          研究方向
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.researchAreas.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#c96442]/10 border border-[#c96442]/20 text-xs text-[#c96442]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {teacher.bio && (
                      <p className="mt-3 text-sm text-[#1a1a1a] leading-relaxed">
                        {teacher.bio}
                      </p>
                    )}

                    {teacher.email && (
                      <div className="mt-3">
                        <a
                          href={`mailto:${teacher.email}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#6b6560] bg-[#faf9f5] hover:bg-[#f0ece4] transition-colors"
                        >
                          <Mail size={12} /> {teacher.email}
                        </a>
                      </div>
                    )}
                  </article>
                </section>
              );
            })()}

            {/* 学生（列表） */}
            <section>
              <h2 className="font-serif text-lg font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                <Users size={18} className="text-[#c96442]" />
                在读研究生
              </h2>
              <div className="space-y-4">
                {sorted.filter((m) => m.role !== "teacher").map((s) => {
                  const grade = calcGrade(s.enrolledAt);
                  const tone = statusToneStudent(s.status);
                  const stat = statOf(s.name);
                  return (
                    <article
                      key={s.name}
                      className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">
                              {s.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_BG[tone] ?? STATUS_BG.gray}`}
                            >
                              {s.status}
                            </span>
                            {s.enrolledAt && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#faf9f5] border border-[#e8e4db] text-xs text-[#1a1a1a] font-medium">
                                {grade.label}
                              </span>
                            )}
                            {s.advisor && (
                              <span className="text-xs text-[#6b6560]">
                                · 导师 {s.advisor}
                              </span>
                            )}
                          </div>
                          {s.enrolledAt && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                              <Calendar size={12} />
                              {s.enrolledAt} 入校
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
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
                      </div>

                      {s.researchAreas && s.researchAreas.length > 0 && (
                        <div className="mt-3">
                          <p className="flex items-center gap-1 text-xs font-semibold text-[#9a9590] mb-1.5">
                            <FlaskConical size={12} />
                            研究方向
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.researchAreas.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#c96442]/10 border border-[#c96442]/20 text-xs text-[#c96442]"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.bio && (
                        <p className="mt-3 text-sm text-[#1a1a1a] leading-relaxed">
                          {s.bio}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(s.email || s.homepage || s.github) ? (
                          <>
                            {s.email && (
                              <a
                                href={`mailto:${s.email}`}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#6b6560] bg-[#faf9f5] hover:bg-[#f0ece4] transition-colors"
                              >
                                <Mail size={12} /> {s.email}
                              </a>
                            )}
                            {s.github && (
                              <a
                                href={s.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#6b6560] bg-[#faf9f5] hover:bg-[#f0ece4] transition-colors"
                              >
                                <Github size={12} /> GitHub
                              </a>
                            )}
                            {s.homepage && (
                              <a
                                href={s.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#6b6560] bg-[#faf9f5] hover:bg-[#f0ece4] transition-colors"
                              >
                                <ExternalLink size={12} /> 主页
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-[#9a9590]">暂无联系方式</span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#f0ece4] flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-[#6b6560]">
                          <span>
                            <strong className="text-[#1a1a1a]">{stat.total}</strong> 项任务
                          </span>
                          <span className="text-amber-800 font-semibold">进行中 {stat.active}</span>
                          <span>已完成 {stat.done}</span>
                        </div>
                        <Link
                          to={`/tasks?member=${encodeURIComponent(s.name)}`}
                          className="inline-flex items-center gap-0.5 text-xs text-[#c96442] hover:text-[#b5573a] transition-colors"
                        >
                          查看任务
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <p className="mt-6 text-xs text-[#9a9590]">
          提示：年级根据入校时间按学年自动计算（每年 9 月起算）。任何写入都会同步到 GitHub 仓库的 <code>tasks.json</code>。
        </p>
      </section>

      <StudentEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}