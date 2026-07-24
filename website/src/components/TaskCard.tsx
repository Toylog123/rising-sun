import { useState } from "react";
import { Users, CalendarClock, History, ChevronDown, Plus, Trash2, Archive, ArchiveRestore } from "lucide-react";
import {
  useTaskStore,
  latestStatus,
  todayStr,
  STATUS_OPTIONS,
  type Task,
} from "@/store/tasks";
import { confirmDialog } from "@/store/ui";
import StatusBadge from "./StatusBadge";

export default function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState("进行中");
  const [note, setNote] = useState("");

  const addUpdate = useTaskStore((s) => s.addUpdate);
  const softRemoveTask = useTaskStore((s) => s.softRemoveTask);
  const setArchived = useTaskStore((s) => s.setArchived);
  const cur = latestStatus(task);
  const timeline = [...task.updates].reverse();

  const submit = () => {
    if (!date) return;
    addUpdate(task.id, { date, status, note: note.trim() || undefined });
    setNote("");
    setAdding(false);
    setOpen(true);
  };

  const handleSoftRemove = async () => {
    const ok = await confirmDialog({
      title: `删除任务「${task.title}」？`,
      description: "删除后会归档到「归档」页面，可在「已删除」Tab 恢复或永久删除。",
      confirmText: "删除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    softRemoveTask(task.id);
  };

  return (
    <div className={`rounded-2xl bg-white border p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/20 ${task.archived ? "border-dashed border-[#d5d0c8] opacity-90" : "border-[#e8e4db]"}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base font-semibold leading-snug text-[#1a1a1a]">
          {task.title}
        </h3>
        <StatusBadge status={cur} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b6560]">
        <span className="flex items-center gap-1">
          <Users size={13} className="text-[#c96442]" />
          {task.assignees.length === 1 ? (
            task.assignees[0]
          ) : (
            <span>
              {task.assignees.slice(0, 2).join("、")}
              {task.assignees.length > 2 && ` 等 ${task.assignees.length} 人`}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1">
          <CalendarClock size={13} />
          创建 {task.createdAt}
        </span>
        <span className="flex items-center gap-1">
          <History size={13} />
          {task.updates.length} 次进展
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-[#f0ece4] pt-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#c96442] hover:text-[#b5573a] transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "收起进展" : "查看进展"}
        </button>
        {!task.archived && (
          <button
            onClick={() => { setAdding((v) => !v); setOpen(true); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6b6560] hover:text-[#c96442] transition-colors"
          >
            <Plus size={14} />
            添加进展
          </button>
        )}
        {task.archived ? (
          <button
            onClick={() => setArchived(task.id, false)}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[#c96442] hover:text-[#b5573a] transition-colors"
          >
            <ArchiveRestore size={13} />
            恢复
          </button>
        ) : (
          <button
            onClick={() => setArchived(task.id, true)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[#6b6560] hover:text-[#c96442] transition-colors"
          >
            <Archive size={13} />
            归档
          </button>
        )}
        <button
          onClick={handleSoftRemove}
          className="inline-flex items-center gap-1 text-xs text-[#9a9590] hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
          删除
        </button>
      </div>

      {adding && !task.archived && (
        <div className="mt-3 rounded-xl bg-[#faf9f5] border border-[#e8e4db] p-3">
          <div className="flex flex-wrap gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-[#e8e4db] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] outline-none focus:border-[#c96442]/40" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[#e8e4db] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] outline-none focus:border-[#c96442]/40">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注（可选）" className="flex-1 min-w-[140px] rounded-lg border border-[#e8e4db] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40" />
            <button onClick={submit} className="rounded-lg bg-[#c96442] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b5573a] transition-colors">保存</button>
          </div>
        </div>
      )}

      {open && (
        <div className="mt-3 pl-1">
          <div className="relative border-l border-[#e8e4db] pl-4 space-y-3">
            {timeline.map((u, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#c96442]" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#6b6560]">{u.date}</span>
                  <StatusBadge status={u.status} />
                  {u.note && <span className="text-xs text-[#9a9590]">（{u.note}）</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
