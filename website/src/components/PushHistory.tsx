import { useState, useEffect, useRef } from "react";
import { History, ChevronDown, X, GitCommit } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import { timeAgo } from "@/lib/github";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

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
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
      >
        <History size={14} className="text-[#6b6560]" />
        <span className="hidden lg:inline whitespace-nowrap">
          {lastSyncedAt ? timeAgo(lastSyncedAt) : "未推送"}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180 text-[#c96442]" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-96 max-h-[28rem] overflow-y-auto rounded-xl border border-[#e8e4db] bg-white shadow-xl shadow-[#c96442]/5">
          <div className="sticky top-0 bg-white border-b border-[#f0ece4] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit size={14} className="text-[#c96442]" />
              <h3 className="font-serif text-sm font-semibold text-[#1a1a1a]">推送历史</h3>
              <span className="rounded-full bg-[#f0ece4] px-1.5 py-0.5 text-xs text-[#6b6560]">
                {history.length}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#9a9590] hover:text-[#1a1a1a]"
            >
              <X size={14} />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <History size={28} className="mx-auto text-[#9a9590] opacity-30" />
              <p className="mt-2 text-sm text-[#6b6560]">还没有推送记录</p>
              <p className="mt-1 text-xs text-[#9a9590]">编辑后点「提交 N 项」按钮即可推送</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0ece4]">
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
                          className={idx === 0 ? "text-[#c96442] shrink-0" : "text-[#9a9590] shrink-0"}
                        />
                        <span className="text-xs font-medium text-[#1a1a1a] truncate">
                          {rec.message}
                        </span>
                      </div>
                      <span className="rounded-full bg-[#c96442]/10 border border-[#c96442]/20 px-1.5 py-0.5 text-xs font-medium text-[#c96442] shrink-0">
                        {rec.count} 项
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-[#9a9590]">
                      <span>{formatTime(rec.ts)}</span>
                      <span className="text-[#6b6560]">{timeAgo(rec.ts)}</span>
                    </div>
                  </button>

                  {expanded === idx && rec.items.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1 border-l-2 border-[#c96442]/20 pl-3">
                      {rec.items.map((it, i) => (
                        <li key={i} className="text-xs text-[#4a4540] leading-relaxed">
                          <span className="inline-block w-3 text-[#c96442]">·</span>
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