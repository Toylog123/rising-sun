import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Users, Calendar, FlaskConical,
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

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 60%, 65%), hsl(${(hue + 40) % 360}, 70%, 55%))`;
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-md"
      />
    );
  }
  return (
    <div
      className="h-20 w-20 rounded-full ring-2 ring-white shadow-md flex items-center justify-center text-white text-xl font-serif font-bold"
      style={{ background: avatarColor(name) }}
    >
      {name.charAt(0)}
    </div>
  );
}

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

  const total = members.length;
  const active = members.filter((m) => m.status === "在读").length;
  const alumni = members.filter((m) => m.status === "已毕业").length;

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
              添加学生
            </button>
          </div>
          <p className="mt-4 text-[15px] text-[#4a4540] leading-relaxed max-w-2xl">
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((s) => {
              const grade = calcGrade(s.enrolledAt);
              const tone = statusToneStudent(s.status);
              const stat = statOf(s.name);
              return (
                <article
                  key={s.name}
                  className="rounded-2xl bg-white border border-[#e8e4db] overflow-hidden transition-all hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/30"
                >
                  <div className="h-2 bg-gradient-to-r from-[#c96442] to-[#e08a63]" />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={s.name} src={s.avatar} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-bold text-[#1a1a1a] truncate">
                          {s.name}
                        </h3>
                        {s.advisor && (
                          <p className="mt-0.5 text-xs text-[#6b6560]">
                            导师：{s.advisor}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                        </div>
                      </div>
                    </div>

                    {s.enrolledAt && (
                      <p className="mt-3 inline-flex items-center gap-1 text-xs text-[#6b6560]">
                        <Calendar size={12} />
                        {s.enrolledAt} 入校
                      </p>
                    )}

                    {s.researchAreas && s.researchAreas.length > 0 && (
                      <div className="mt-3">
                        <p className="flex items-center gap-1 text-xs font-semibold text-[#9a9590] mb-1.5">
                          <FlaskConical size={12} />
                          研究方向
                        </p>
                        <div className="flex flex-wrap gap-1">
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
                      <p className="mt-3 text-sm text-[#4a4540] leading-relaxed line-clamp-3">{s.bio}</p>
                    )}

                    {s.note && !s.bio && (
                      <p className="mt-3 text-sm text-[#4a4540] leading-relaxed line-clamp-2">
                        {s.note}
                      </p>
                    )}

                    {(s.email || s.homepage || s.github) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {s.email && (
                          <a
                            href={`mailto:${s.email}`}
                            title="邮箱"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
                          >
                            <Mail size={12} /> {s.email}
                          </a>
                        )}
                        {s.github && (
                          <a
                            href={s.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="GitHub"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
                          >
                            <Github size={13} />
                          </a>
                        )}
                        {s.homepage && (
                          <a
                            href={s.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="个人主页"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-[#f0ece4] flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-[#6b6560]">
                        <span>
                          <strong className="text-[#1a1a1a]">{stat.total}</strong> 项任务
                        </span>
                        <span className="text-[#c96442] font-semibold">
                          进行中 {stat.active}
                        </span>
                        <span>
                          已完成 {stat.done}
                        </span>
                      </div>
                      <Link
                        to={`/tasks?member=${encodeURIComponent(s.name)}`}
                        className="inline-flex items-center gap-0.5 text-xs text-[#c96442] hover:text-[#b5573a] transition-colors"
                      >
                        任务
                        <ArrowRight size={11} />
                      </Link>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#f0ece4] flex items-center justify-end gap-1">
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
                </article>
              );
            })}
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