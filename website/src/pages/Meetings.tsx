import { useState } from "react";
import { Plus, Pencil, Calendar, Users, FlaskConical, CheckCircle2, FileText, Download } from "lucide-react";
import { useMeetingStore, type Meeting } from "@/store/meetings";
import MeetingEditor from "@/components/MeetingEditor";
import { downloadText, timestamp, meetingsToMarkdown } from "@/lib/download";

export default function Meetings() {
  const meetings = useMeetingStore((s) => s.meetings);
  const pull = useMeetingStore((s) => s.pull);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const sorted = [...meetings].sort((a, b) => b.date.localeCompare(a.date));

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
            <p className="text-sm text-[#6b6560] mt-1">每周组会的简要纪要 · 共 {meetings.length} 期</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => pull()}
            className="rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 transition-colors"
          >
            刷新
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

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#e8e4db] px-6 py-16 text-center">
          <Users size={32} className="mx-auto text-[#9a9590]" />
          <p className="mt-3 text-sm text-[#6b6560]">还没有组会记录</p>
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
          {sorted.map((m) => (
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
            </article>
          ))}
        </div>
      )}

      <MeetingEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}