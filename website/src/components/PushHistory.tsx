import { useState, useEffect, useRef } from "react";
import { History, ChevronDown, X, GitCommit } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import { timeAgo } from "@/lib/github";

export default function PushHistory() {
  const history = useTaskStore((s) => s.pushHistory);
  const lastSyncedAt = useTaskStore((s) => s.lastSyncedAt);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="推送历史"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted hover:bg-wash transition-colors"
      >
        <History size={14} className="text-muted" />
        <span className="hidden lg:inline whitespace-nowrap">
          {lastSyncedAt ? timeAgo(lastSyncedAt) : "未推送"}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180 text-accent" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-96 max-h-[28rem] overflow-y-auto rounded-xl border border-line bg-paper shadow-xl shadow-accent/5">
          <div className="sticky top-0 bg-paper border-b border-wash px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit size={14} className="text-accent" />
              <h3 className="font-serif text-sm font-semibold text-ink">推送历史</h3>
              <span className="rounded-full bg-wash px-1.5 py-0.5 text-xs text-muted">
                {history.length}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-faint hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <History size={28} className="mx-auto text-faint opacity-30" />
              <p className="mt-2 text-sm text-muted">还没有推送记录</p>
              <p className="mt-1 text-xs text-faint">编辑后点「提交 N 项」按钮即可推送</p>
            </div>
          ) : (
            <ul className="divide-y divide-wash">
              {history.map((rec, idx) => (
                <li key={rec.ts} className="px-4 py-3">
                  <button
                    onClick={() => setExpanded((cur) => (cur === idx ? null : idx))}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GitCommit
                          size={13}
                          className={idx === 0 ? "text-accent shrink-0" : "text-faint shrink-0"}
                        />
                        <span className="text-xs font-medium text-ink truncate">
                          {rec.message}
                        </span>
                      </div>
                      <span className="rounded-full bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-xs font-medium text-accent shrink-0">
                        {rec.count} 项
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-faint">
                      {timeAgo(rec.ts)}
                    </div>
                  </button>

                  {expanded === idx && rec.items.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1 border-l-2 border-accent/20 pl-3">
                      {rec.items.map((it, i) => (
                        <li key={i} className="text-xs text-body-strong leading-relaxed">
                          <span className="inline-block w-3 text-accent">·</span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}