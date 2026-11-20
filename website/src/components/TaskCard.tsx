import { useState, type KeyboardEvent } from "react";
import { Pencil, CalendarClock, History, ChevronDown, Plus, Trash2, Archive, ArchiveRestore } from "lucide-react";
import {
  useTaskStore,
  latestStatus,
  todayStr,
  STATUS_OPTIONS,
  type Task,
} from "@/store/tasks";
import { confirmDialog } from "@/store/ui";
import { stalenessOf, updatedAgoLabel, STALE_TONE } from "@/lib/staleness";
import { useDayTick } from "@/lib/useDayTick";
import StatusBadge from "./StatusBadge";
import TaskEditor from "./TaskEditor";

export default function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState("进行中");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);

  const addUpdate = useTaskStore((s) => s.addUpdate);
  const softRemoveTask = useTaskStore((s) => s.softRemoveTask);
  const setArchived = useTaskStore((s) => s.setArchived);
  const cur = latestStatus(task);
  const timeline = [...task.updates].reverse();
  const now = useDayTick();
  const stale = stalenessOf(task, now);

  const toggleOpen = () => setOpen((v) => !v);

  // 卡片主体可直接点开/收起进展；同时保留键盘可达性（卡片是 div，得自己补 role 和按键处理）
  const onCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  };

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

  const assigneeText =
    task.assignees.length === 1
      ? task.assignees[0]
      : task.assignees.length > 2
      ? `${task.assignees.slice(0, 2).join("、")} 等 ${task.assignees.length} 人`
      : task.assignees.join("、");

  return (
    <div
      onClick={toggleOpen}
      onKeyDown={onCardKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`${task.title}，${open ? "收起" : "查看"}进展`}
      title={open ? "点击收起进展" : "点击展开进展"}
      className={`rounded-2xl bg-paper border p-5 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:border-accent/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${task.archived ? "border-dashed border-line-strong opacity-90" : "border-line"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base font-semibold leading-snug text-ink">
          {task.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={cur} />
          {!task.archived && (
            <button
              onClick={(e) => {
                // 卡片整体可点，按钮必须挡住冒泡，否则编辑会被当成展开/收起
                e.stopPropagation();
                setEditing(true);
              }}
              title="编辑"
              className="p-1 rounded-md text-muted hover:text-accent hover:bg-paper transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <CalendarClock size={13} className="text-accent" />
          {assigneeText}
        </span>
        <span className="flex items-center gap-1">
          <CalendarClock size={13} />
          创建 {task.createdAt}
        </span>
        <span className="flex items-center gap-1">
          <History size={13} />
          {task.updates.length} 次进展
        </span>
        {stale && (
          <span
            title={`上次更新：${stale.lastDate}`}
            className={`ml-auto inline-flex items-center gap-1 text-xs ${STALE_TONE[stale.level]}`}
          >
            <CalendarClock size={12} />
            {updatedAgoLabel(stale.days)}
          </span>
        )}
      </div>

      {/* 操作栏：整栏挡住冒泡，点了归档/删除/添加进展不会顺带收起卡片 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-3 flex items-center gap-3 border-t border-wash pt-3"
      >
        <button
          onClick={toggleOpen}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-deep transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "收起进展" : "查看进展"}
        </button>
        {!task.archived && (
          <button
            onClick={() => { setAdding((v) => !v); setOpen(true); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent transition-colors"
          >
            <Plus size={14} />
            添加进展
          </button>
        )}
        {task.archived ? (
          <button
            onClick={() => setArchived(task.id, false)}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-deep transition-colors"
          >
            <ArchiveRestore size={13} />
            恢复
          </button>
        ) : (
          <button
            onClick={() => setArchived(task.id, true)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
          >
            <Archive size={13} />
            归档
          </button>
        )}
        <button
          onClick={handleSoftRemove}
          className="inline-flex items-center gap-1 text-xs text-faint hover:text-danger-ink transition-colors"
        >
          <Trash2 size={13} />
          删除
        </button>
      </div>

      {adding && !task.archived && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 rounded-xl bg-paper border border-line p-3"
        >
          <div className="flex flex-wrap gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent/40" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent/40">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注（可选）" className="flex-1 min-w-[140px] rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink placeholder-faint outline-none focus:border-accent/40" />
            <button onClick={submit} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-deep transition-colors">保存</button>
          </div>
        </div>
      )}

      {open && (
        // 这里不加 stopPropagation：卡片展开后中心落在时间线上，
        // 拦掉的话"再点一次收起"就会失灵。整块都算卡片，点哪都能切。
        <div className="mt-3 pl-1">
          <div className="relative border-l border-line pl-4 space-y-3">
            {timeline.map((u, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted">{u.date}</span>
                  <StatusBadge status={u.status} />
                  {u.note && <span className="text-xs text-faint">（{u.note}）</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TaskEditor 在卡片 DOM 内部，而 React 事件沿组件树冒泡，
          所以弹窗里点任何东西都会触发卡片的展开/收起，这里挡一下 */}
      <div onClick={(e) => e.stopPropagation()}>
        <TaskEditor open={editing} task={task} onClose={() => setEditing(false)} />
      </div>
    </div>
  );
}
