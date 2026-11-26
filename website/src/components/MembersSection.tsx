import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Users, Calendar, FlaskConical, GraduationCap,
  Mail, Github, ExternalLink, ArrowRight, Award,
} from "lucide-react";
import { useTaskStore, latestStatus, statusTone, type Student } from "@/store/tasks";
import { calcGrade, statusToneStudent } from "@/lib/students";
import { confirmDialog } from "@/store/ui";
import StudentEditor from "@/components/StudentEditor";
import Avatar from "@/components/Avatar";

const STATUS_BG: Record<string, string> = {
  green: "bg-success-wash text-success-ink border-success-line",
  amber: "bg-warning-wash text-warning-ink border-warning-line",
  red: "bg-danger-wash text-danger-ink border-danger-line",
  gray: "bg-wash text-muted border-line",
  blue: "bg-info-wash text-info-ink border-info-line",
};

/** 首页「成员」模块：整合原成员页的完整展示与增删改交互 */
export default function MembersSection() {
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
    <section id="members" className="scroll-mt-20 border-t border-line bg-paper">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        {/* 模块标题（与首页其它区块一致：eyebrow + section-mark 标题） */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-4"><Users size={12} className="text-accent" />课题组成员</span>
            <h2 className="section-mark font-serif text-3xl font-bold tracking-heading text-ink sm:text-4xl">我们的团队</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              共 {total} 人 · 在读 {active} · 已毕业 {alumni}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-deep"
          >
            <Plus size={15} />
            添加成员
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl bg-paper border border-line px-6 py-16 text-center">
            <Users size={32} className="mx-auto text-faint" />
            <p className="mt-3 text-sm text-muted">还没有学生档案</p>
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={15} />
              添加第一个学生
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 学术带头人（正式介绍：突出资历与团队引领，不当实际指导教师，不显示邮箱/方向/编辑） */}
            {(() => {
              const honorary = sorted.filter((m) => m.role === "teacher" && m.name !== advisor);
              if (honorary.length === 0) return null;
              return (
                <section>
                  <h3 className="font-serif text-lg font-bold text-ink mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-accent" />
                    学术带头人
                  </h3>
                  <div className="space-y-4">
                    {honorary.map((t) => (
                      <article
                        key={t.name}
                        className="rounded-2xl bg-paper border border-line p-5 transition-all hover:shadow-md hover:border-accent/30"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <Avatar name={t.name} src={t.avatar} size={52} />
                          <h4 className="font-serif text-xl font-bold text-ink">{t.name}</h4>
                          {t.title && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                              {t.title}
                            </span>
                          )}
                        </div>
                        {t.bio && (
                          <p className="mt-3 text-sm text-ink leading-[1.85] text-justify">
                            {t.bio}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* 指导教师（实际带学生，完整卡片） */}
            {(() => {
              const teachers = sorted.filter((m) => m.role === "teacher" && m.name === advisor);
              if (teachers.length === 0) return null;
              return (
                <section>
                  <h3 className="font-serif text-lg font-bold text-ink mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-accent" />
                    指导教师
                  </h3>
                  <div className="space-y-4">
                    {teachers.map((teacher) => (
                      <article
                        key={teacher.name}
                        className="rounded-2xl bg-paper border border-line p-5 transition-all hover:shadow-md hover:border-accent/30"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Avatar name={teacher.name} src={teacher.avatar} size={52} />
                            <h4 className="font-serif text-xl font-bold text-ink">
                              {teacher.name}
                            </h4>
                            {teacher.title && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                                {teacher.title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(teacher)}
                              title="编辑"
                              className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-paper transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleRemove(teacher)}
                              title="移除"
                              className="p-1.5 rounded-md text-muted hover:text-danger-ink hover:bg-danger-wash transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {teacher.researchAreas && teacher.researchAreas.length > 0 && (
                          <div className="mt-3">
                            <p className="flex items-center gap-1 text-xs font-semibold text-faint mb-1.5">
                              <FlaskConical size={12} />
                              研究方向
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {teacher.researchAreas.map((r) => (
                                <span
                                  key={r}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-xs text-accent"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {teacher.bio && (
                          <p className="mt-3 text-sm text-ink leading-relaxed">
                            {teacher.bio}
                          </p>
                        )}

                        {teacher.email && (
                          <div className="mt-3">
                            <a
                              href={`mailto:${teacher.email}`}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted bg-paper hover:bg-wash transition-colors"
                            >
                              <Mail size={12} /> {teacher.email}
                            </a>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* 学生（列表） */}
            <section>
              <h3 className="font-serif text-lg font-bold text-ink mb-3 flex items-center gap-2">
                <Users size={18} className="text-accent" />
                在读研究生
              </h3>
              <div className="space-y-4">
                {sorted.filter((m) => m.role !== "teacher").map((s) => {
                  const grade = calcGrade(s.enrolledAt);
                  const tone = statusToneStudent(s.status);
                  const stat = statOf(s.name);
                  return (
                    <article
                      key={s.name}
                      className="rounded-2xl bg-paper border border-line p-5 transition-all hover:shadow-md hover:border-accent/30"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Avatar name={s.name} src={s.avatar} size={48} />
                            <h4 className="font-serif text-xl font-bold text-ink">
                              {s.name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_BG[tone] ?? STATUS_BG.gray}`}
                            >
                              {s.status}
                            </span>
                            {s.enrolledAt && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-paper border border-line text-xs text-ink font-medium">
                                {grade.label}
                              </span>
                            )}
                            {s.advisor && (
                              <span className="text-xs text-muted">
                                · 导师 {s.advisor}
                              </span>
                            )}
                          </div>
                          {s.enrolledAt && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                              <Calendar size={12} />
                              {s.enrolledAt} 入校
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            title="编辑"
                            className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-paper transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRemove(s)}
                            title="移除"
                            className="p-1.5 rounded-md text-muted hover:text-danger-ink hover:bg-danger-wash transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {s.researchAreas && s.researchAreas.length > 0 && (
                        <div className="mt-3">
                          <p className="flex items-center gap-1 text-xs font-semibold text-faint mb-1.5">
                            <FlaskConical size={12} />
                            研究方向
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.researchAreas.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-xs text-accent"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.bio && (
                        <p className="mt-3 text-sm text-ink leading-relaxed">
                          {s.bio}
                        </p>
                      )}

                      {/* 学位要求：卡片只保留简洁入口，状态与详情统一放到「学位要求」分页面 */}
                      {(s.program || s.degree) && (
                        <Link
                          to={`/degree-requirements?student=${encodeURIComponent(s.name)}`}
                          className="group/deg mt-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas/60 px-3 py-2.5 transition-colors hover:border-accent/40 hover:bg-wash/60"
                        >
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                            <Award size={14} className="text-accent" />
                            {s.degree ?? "硕士"}毕业要求 · {s.program ?? "集成电路科学与工程"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-xs text-accent transition-colors group-hover/deg:text-accent-deep">
                            查看详情
                            <ArrowRight size={13} className="transition-transform group-hover/deg:translate-x-0.5" />
                          </span>
                        </Link>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(s.email || s.homepage || s.github) ? (
                          <>
                            {s.email && (
                              <a
                                href={`mailto:${s.email}`}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted bg-paper hover:bg-wash transition-colors"
                              >
                                <Mail size={12} /> {s.email}
                              </a>
                            )}
                            {s.github && (
                              <a
                                href={s.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted bg-paper hover:bg-wash transition-colors"
                              >
                                <Github size={12} /> GitHub
                              </a>
                            )}
                            {s.homepage && (
                              <a
                                href={s.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted bg-paper hover:bg-wash transition-colors"
                              >
                                <ExternalLink size={12} /> 主页
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-faint">暂无联系方式</span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-wash flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span>
                            <strong className="text-ink">{stat.total}</strong> 项任务
                          </span>
                          <span className="text-warning-ink font-semibold">进行中 {stat.active}</span>
                          <span>已完成 {stat.done}</span>
                        </div>
                        <Link
                          to={`/tasks?member=${encodeURIComponent(s.name)}`}
                          className="inline-flex items-center gap-0.5 text-xs text-accent hover:text-accent-deep transition-colors"
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

        <p className="mt-6 text-xs text-faint">
          提示：年级根据入校时间按学年自动计算（每年 9 月起算）。任何写入都会同步到 GitHub 仓库的 <code>tasks.json</code>。
        </p>
      </div>

      <StudentEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
      />
    </section>
  );
}
