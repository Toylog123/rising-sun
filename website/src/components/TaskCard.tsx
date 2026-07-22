import { useState } from "react";
import { User, CalendarClock, History, ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  useTaskStore,
  latestStatus,
  todayStr,
  STATUS_OPTIONS,
  type Task,
} from "@/store/tasks";
import StatusBadge from "./StatusBadge";

export default function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState("进行中");
  const [note, setNote] = useState("");

  const addUpdate = useTaskStore((s) => s.addUpdate);
  const removeTask = useTaskStore((s) => s.removeTask);
  const cur = latestStatus(task);
  const timeline = [...task.updates].reverse(); // 最新在前

  const submit = () => {
    if (!date) return;
    addUpdate(task.id, { date, status, note: note.trim() || undefined });
    setNote("");
    setAdding(false);
    setOpen(true);
  };

  return (
    <div className="rounded-2xl bg-white border border-[#e8e4db] p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/20">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base font-semibold leading-snug text-[#1a1a1a]">
          {task.title}
        </h3>
        <StatusBadge status={cur} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b6560]">
        <span className="flex items-center gap-1">
          <User size={13} className="text-[#c96442]" />
          {task.assignee}
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

      {/* 操作 */}
      <div className="mt-3 flex items-center gap-3 border-t border-[#f0ece4] pt-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#c96442] hover:text-[#b5573a] transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "收起进展" : "查看进展"}
        </button>
        <button
          onClick={() => { setAdding((v) => !v); setOpen(true); }}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#6b6560] hover:text-[#c96442] transition-colors"
        >
          <Plus size={14} />
          添加进展
        </button>
        <button
          onClick={() => removeTask(task.id)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-[#9a9590] hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
          删除
        </button>
      </div>

      {/* 添加进展表单 */}
      {adding && (
        <div className="mt-3 rounded-xl bg-[#faf9f5] border border-[#e8e4db] p-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#e8e4db] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] outline-none focus:border-[#c96442]/40"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-[#e8e4db] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] outline-none focus:border-[#c96442]/40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注（可选，如：下次组会汇报）"
              className="flex-1 min-w-[140px] rounded-lg border border-[#e8e4db] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40"
            />
            <button
              onClick={submit}
              className="rounded-lg bg-[#c96442] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b5573a] transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 进展时间线 */}
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
