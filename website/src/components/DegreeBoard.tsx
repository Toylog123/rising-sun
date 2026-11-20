import { useMemo } from "react";
import { CheckCircle2, Circle, AlertTriangle, Award, FileText } from "lucide-react";
import { useAchievementStore } from "@/store/achievements";
import type { Student } from "@/store/tasks";
import { auditCandidate } from "@/lib/degreeAudit";
import { levelLabel } from "@/data/degreeAwards";

/** 学生卡片上的毕业要求进度条 */
export function DegreeProgress({ student }: { student: Student }) {
  const achievements = useAchievementStore((s) => s.achievements);
  const audit = useMemo(() => {
    if (!student.program || !student.degree) return null;
    return auditCandidate(
      { name: student.name, program: student.program, degree: student.degree },
      achievements,
    );
  }, [achievements, student.program, student.degree, student.name]);

  if (!audit) {
    return (
      <div className="mt-3 rounded-xl border border-warning-line bg-warning-wash px-3 py-2 text-xs text-warning-ink">
        未设置学科 / 学位层次，无法判定毕业要求 —— 点「编辑」补上即可。
      </div>
    );
  }

  const paperCount = audit.papers.filter((p) => p.level !== "非目录" && p.credited).length;
  const tone = audit.ready
    ? "border-success-line bg-success-wash text-success-ink"
    : audit.basicReady
      ? "border-warning-line bg-warning-wash text-warning-ink"
      : "border-line bg-paper text-muted";

  return (
    <div className={`mt-3 rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="flex items-center justify-between gap-2 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Award size={13} />
          {student.degree}毕业要求 · {student.program}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={12} />
          目录内成果 {paperCount} 篇
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1">
          {audit.basicReady ? <CheckCircle2 size={12} /> : <Circle size={12} />}
          基本要求{audit.basicReady ? "已达成" : "未达成"}
        </span>
        <span className="inline-flex items-center gap-1">
          {audit.publicReady ? <CheckCircle2 size={12} /> : <Circle size={12} />}
          公开评审{audit.publicReady ? "已满足一条通道" : "尚未满足"}
        </span>
        {audit.ready && (
          <span className="inline-flex items-center gap-1 font-semibold">
            <CheckCircle2 size={12} /> 成果条件已齐
          </span>
        )}
      </div>
    </div>
  );
}

/** 毕业要求详情面板（可放在任何页面） */
export default function DegreeBoard({ student }: { student: Student }) {
  const achievements = useAchievementStore((s) => s.achievements);
  const audit = useMemo(() => {
    if (!student.program || !student.degree) return null;
    return auditCandidate(
      { name: student.name, program: student.program, degree: student.degree },
      achievements,
    );
  }, [achievements, student.program, student.degree, student.name]);

  if (!audit) {
    return (
      <div className="rounded-xl border border-warning-line bg-warning-wash px-3 py-2.5 text-xs text-warning-ink">
        缺少学科 / 学位层次，无法按目录判定。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border px-4 py-3 ${
          audit.ready
            ? "border-success-line bg-success-wash"
            : audit.basicReady
              ? "border-warning-line bg-warning-wash"
              : "border-line bg-paper"
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          {audit.ready ? (
            <CheckCircle2 size={16} className="text-success-ink" />
          ) : (
            <AlertTriangle size={16} className="text-warning-ink" />
          )}
          {audit.ready
            ? `已满足 ${student.degree}毕业的成果条件`
            : audit.basicReady
              ? "基本要求已达成，公开评审通道尚未满足"
              : "基本要求尚未达成"}
        </div>
        <p className="mt-1 text-xs text-muted">
          按 {student.program} · {student.degree} 的学院目录判定，不含学位论文本身。
        </p>
      </div>

      {/* 基本要求 */}
      <section>
        <h4 className="text-sm font-semibold text-ink mb-2">基本要求</h4>
        <div className="space-y-1.5">
          {audit.basic.map((r) => (
            <div
              key={r.rule.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-wash bg-paper px-3 py-2"
            >
              <div className="flex items-start gap-2">
                {r.satisfied ? (
                  <CheckCircle2 size={14} className="mt-0.5 text-success-ink shrink-0" />
                ) : (
                  <Circle size={14} className="mt-0.5 text-line-strong shrink-0" />
                )}
                <div>
                  <p className="text-sm text-ink">{r.rule.title}</p>
                  <p className="text-xs text-faint">{r.rule.desc}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted">{r.progress}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 公开评审 */}
      <section>
        <h4 className="text-sm font-semibold text-ink mb-2">公开评审通道（满足任一条即可）</h4>
        <div className="space-y-1.5">
          {audit.publicGroups.map((g) => (
            <div
              key={g.group}
              className={`rounded-lg border px-3 py-2 ${
                g.ready ? "border-success-line bg-success-wash/50" : "border-wash bg-paper"
              }`}
            >
              <p className="text-xs font-semibold text-muted mb-1">
                {g.group === "A" ? "A 档通道" : g.group === "B" ? "B 档通道" : "其他通道"}
                {g.ready && <span className="ml-2 text-success-ink">已满足</span>}
              </p>
              <div className="space-y-1">
                {g.results.map((r) => (
                  <div key={r.rule.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {r.satisfied ? (
                        <CheckCircle2 size={13} className="mt-0.5 text-success-ink shrink-0" />
                      ) : (
                        <Circle size={13} className="mt-0.5 text-line-strong shrink-0" />
                      )}
                      <span className="text-xs text-ink">{r.rule.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-faint">{r.progress}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 逐篇等级 */}
      <section>
        <h4 className="text-sm font-semibold text-ink mb-2">
          成果等级判定（{audit.papers.length} 篇）
        </h4>
        {audit.papers.length === 0 ? (
          <p className="text-xs text-faint">还没有归属到本人的论文。在「成果」页新增时选择归属人即可。</p>
        ) : (
          <div className="space-y-1.5">
            {audit.papers.map((p) => (
              <div key={p.paper.id} className="rounded-lg border border-wash bg-paper px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink">{p.paper.title}</p>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                      p.level === "非目录"
                        ? "bg-wash text-faint"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {levelLabel(p.level)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-faint">
                  {p.paper.venue} · {p.paper.year} · 等效 {p.weight} 篇
                  {p.reasons.length > 0 && ` · ${p.reasons.join("；")}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {audit.manual.length > 0 && (
        <p className="rounded-lg bg-paper border border-line px-3 py-2 text-xs text-muted">
          {audit.manual.join("；")}。最终认定以学院为准。
        </p>
      )}
    </div>
  );
}