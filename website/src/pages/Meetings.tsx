import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Calendar, Users, FlaskConical, CheckCircle2, FileText, Download, Paperclip, Eye, AlertCircle } from "lucide-react";
import { useMeetingStore, type Meeting } from "@/store/meetings";
import MeetingEditor from "@/components/MeetingEditor";
import PdfPreview from "@/components/PdfPreview";
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#c96442] text-white">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">组会记录</h1>
            <p className="text-sm text-[#6b6560] mt-1">
              每周组会的简要纪要与汇报材料 · 共 {meetings.length} 期
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => pull()}
            disabled={syncStatus === "pulling"}
            className="rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 transition-colors disabled:opacity-50"
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#c96442] transition-colors"
          >
            <Download size={14} />
            导出
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
          >
            <Plus size={15} />
            新增组会
          </button>
        </div>
      </div>

      {/* 同步失败提示：拉不到远端时要说清楚，而不是让页面看起来就是空的 */}
      {syncError && (
        <div className="mb-5 rounded-xl border border-[#e8b4a4] bg-[#fdf3ef] px-4 py-3 text-sm text-[#a1452a] flex items-center gap-2 flex-wrap">
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
          <span className="text-xs text-[#9a9590] mr-1">按主讲人：</span>
          <button
            onClick={() => setSpeakerFilter(null)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              speakerFilter === null
                ? "bg-[#c96442] text-white"
                : "border border-[#e8e4db] bg-white text-[#6b6560] hover:border-[#c96442]/40"
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
                  ? "bg-[#c96442] text-white"
                  : "border border-[#e8e4db] bg-white text-[#6b6560] hover:border-[#c96442]/40"
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
        <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-16 text-center">
          <Users size={32} className="mx-auto text-[#9a9590]" />
          <p className="mt-3 text-sm text-[#6b6560]">
            {speakerFilter ? `「${speakerFilter}」还没有组会记录` : "还没有组会记录"}
          </p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white"
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
              className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all hover:shadow-md hover:border-[#c96442]/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b6560]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-[#c96442]" />
                      {m.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FlaskConical size={12} />
                      主讲：{m.speaker}
                    </span>
                  </div>
                  <h2 className="mt-1 font-serif text-lg font-semibold text-[#1a1a1a] leading-snug">
                    {m.topic}
                  </h2>
                </div>
                <button
                  onClick={() => openEdit(m)}
                  className="shrink-0 p-1.5 rounded-md text-[#6b6560] hover:text-[#c96442] hover:bg-[#faf9f5] transition-colors"
                  title="编辑"
                >
                  <Pencil size={14} />
                </button>
              </div>

              {m.notes && (
                <div className="mt-3 pt-3 border-t border-[#f0ece4]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9a9590] mb-1">
                    <FileText size={12} />
                    纪要
                  </div>
                  <p className="text-sm text-[#4a4540] whitespace-pre-wrap leading-relaxed">{m.notes}</p>
                </div>
              )}

              {m.decisions && (
                <div className="mt-3 pt-3 border-t border-[#f0ece4]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9a9590] mb-1">
                    <CheckCircle2 size={12} />
                    决议
                  </div>
                  <p className="text-sm text-[#4a4540] whitespace-pre-wrap leading-relaxed">{m.decisions}</p>
                </div>
              )}

              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#f0ece4]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9a9590] mb-2">
                    <Paperclip size={12} />
                    汇报材料
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {m.attachments.map((a) => (
                      <li key={a.path}>
                        <button
                          onClick={() => setPreview(a)}
                          title="点击预览 PDF"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4db] bg-[#faf9f5] px-2.5 py-1.5 text-xs text-[#4a4540] hover:border-[#c96442]/50 hover:text-[#c96442] transition-colors max-w-[260px]"
                        >
                          <Eye size={12} className="shrink-0 text-[#c96442]" />
                          <span className="truncate">{a.name}</span>
                          <span className="shrink-0 text-[#9a9590]">{formatBytes(a.size)}</span>
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
