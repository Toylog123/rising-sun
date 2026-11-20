import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Calendar, Users, FlaskConical, FileText, Download, Paperclip, Eye, AlertCircle, GraduationCap } from "lucide-react";
import { useMeetingStore, type Meeting } from "@/store/meetings";
import MeetingEditor from "@/components/MeetingEditor";
import PdfPreview from "@/components/PdfPreview";
import CollapsibleText from "@/components/CollapsibleText";
import { downloadText, timestamp, meetingsToMarkdown } from "@/lib/download";
import { formatBytes, type MeetingAttachment } from "@/lib/uploads";



export default function Meetings() {
  const meetings = useMeetingStore((s) => s.meetings);
  const pull = useMeetingStore((s) => s.pull);
  const syncStatus = useMeetingStore((s) => s.syncStatus);
  const syncError = useMeetingStore((s) => s.syncError);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [preview, setPreview] = useState<MeetingAttachment | null>(null);
  const [speakerFilter, setSpeakerFilter] = useState<string | null>(null);

  // 进页面自动拉一次远端，保证看到的是仓库里最新的记录
  useEffect(() => {
    if (syncStatus === "idle") pull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () => [...meetings].sort((a, b) => b.date.localeCompare(a.date)),
    [meetings]
  );

  // 所有主讲人 + 各自汇报次数，方便「看谁每次汇报了啥」
  const speakerStats = useMemo(() => {
    const map = new Map<string, { count: number; files: number; last: string }>();
    for (const m of sorted) {
      const cur = map.get(m.speaker) ?? { count: 0, files: 0, last: m.date };
      cur.count += 1;
      cur.files += m.attachments?.length ?? 0;
      if (m.date > cur.last) cur.last = m.date;
      map.set(m.speaker, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [sorted]);

  const visible = speakerFilter ? sorted.filter((m) => m.speaker === speakerFilter) : sorted;

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (m: Meeting) => {
    setEditing(m);
    setEditorOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-control bg-gradient-to-br from-accent to-accent-deep text-white shadow-brand shadow-hairline ring-1 ring-inset ring-white/15">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">组会记录</h1>
            <p className="text-sm text-muted mt-1">
              每周组会的简要纪要与汇报材料 · 共 {meetings.length} 期
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/degree-requirements"
            title="学位授予与评阅要求、紧密相关成果范围目录"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-accent transition-colors"
          >
            <GraduationCap size={14} />
            学位要求
          </Link>
          <button
            onClick={() => pull()}
            disabled={syncStatus === "pulling"}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm text-muted hover:border-accent/40 transition-colors disabled:opacity-50"
          >
            {syncStatus === "pulling" ? "刷新中…" : "刷新"}
          </button>
          <button
            onClick={() =>
              downloadText(
                `meetings-${timestamp()}.md`,
                meetingsToMarkdown({ meetings })
              )
            }
            title="导出全部组会记录为 Markdown（可直接阅读）"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-accent transition-colors"
          >
            <Download size={14} />
            导出
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-deep"
          >
            <Plus size={15} />
            新增组会
          </button>
        </div>
      </div>

      {/* 同步失败提示：拉不到远端时要说清楚，而不是让页面看起来就是空的 */}
      {syncError && (
        <div className="mb-5 rounded-xl border border-danger-line bg-danger-wash px-4 py-3 text-sm text-danger-ink flex items-center gap-2 flex-wrap">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">同步失败：{syncError}</span>
          <button
            onClick={() => pull()}
            className="font-medium underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* 按主讲人筛选：一眼看清谁汇报过几次、传了几份材料 */}
      {speakerStats.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-faint mr-1">按主讲人：</span>
          <button
            onClick={() => setSpeakerFilter(null)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              speakerFilter === null
                ? "bg-accent text-white"
                : "border border-line bg-paper text-muted hover:border-accent/40"
            }`}
          >
            全部 {sorted.length}
          </button>
          {speakerStats.map(([name, st]) => (
            <button
              key={name}
              onClick={() => setSpeakerFilter(speakerFilter === name ? null : name)}
              title={`最近一次：${st.last}`}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                speakerFilter === name
                  ? "bg-accent text-white"
                  : "border border-line bg-paper text-muted hover:border-accent/40"
              }`}
            >
              {name} {st.count}
              {st.files > 0 && (
                <span className="ml-1 opacity-70">· {st.files} 份材料</span>
              )}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-paper border border-line px-6 py-16 text-center">
          <Users size={32} className="mx-auto text-faint" />
          <p className="mt-3 text-sm text-muted">
            {speakerFilter ? `「${speakerFilter}」还没有组会记录` : "还没有组会记录"}
          </p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={15} />
            添加第一期组会
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl bg-paper border border-line p-5 transition-all hover:shadow-md hover:border-accent/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-accent" />
                      {m.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FlaskConical size={12} />
                      主讲：{m.speaker}
                    </span>
                  </div>
                  <h2 className="mt-1 font-serif text-lg font-semibold text-ink leading-snug">
                    {m.topic}
                  </h2>
                </div>
                <button
                  onClick={() => openEdit(m)}
                  className="shrink-0 p-1.5 rounded-md text-muted hover:text-accent hover:bg-paper transition-colors"
                  title="编辑"
                >
                  <Pencil size={14} />
                </button>
              </div>

              {m.notes && (
                <div className="mt-3 pt-3 border-t border-wash">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-faint mb-1">
                    <FileText size={12} />
                    纪要
                  </div>
                  <CollapsibleText text={m.notes} />
                </div>
              )}

              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-wash">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-faint mb-2">
                    <Paperclip size={12} />
                    汇报材料
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {m.attachments.map((a) => (
                      <li key={a.path}>
                        <button
                          onClick={() => setPreview(a)}
                          title="点击预览 PDF"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-body-strong hover:border-accent/50 hover:text-accent transition-colors max-w-[260px]"
                        >
                          <Eye size={12} className="shrink-0 text-accent" />
                          <span className="truncate">{a.name}</span>
                          <span className="shrink-0 text-faint">{formatBytes(a.size)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <MeetingEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
      />

      <PdfPreview attachment={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
