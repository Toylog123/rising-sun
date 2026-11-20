import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useUIStore, type ToastKind } from "@/store/ui";

const ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLE: Record<ToastKind, string> = {
  success: "bg-success-wash text-success-ink border-success-line",
  error: "bg-danger-wash text-danger-ink border-danger-line",
  info: "bg-info-wash text-info-ink border-info-line",
};

export default function Toast() {
  const toast = useUIStore((s) => s.toast);
  const clearToast = useUIStore((s) => s.clearToast);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.duration ?? 3000;
    if (ms <= 0) return;
    const id = setTimeout(() => {
      clearToast();
    }, ms);
    return () => clearTimeout(id);
  }, [toast, clearToast]);

  useEffect(() => {
    if (!toast) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [toast]);

  if (!toast) return null;

  const Icon = ICON[toast.kind];
  const style = STYLE[toast.kind];

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[300] w-[calc(100%-2rem)] max-w-sm sm:right-6">
      <div
        className={`flex animate-[slideIn_220ms_cubic-bezier(0.22,1,0.36,1)] items-start gap-3 rounded-control border px-4 py-3.5 shadow-lift ${style} pointer-events-auto`}
      >
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>
          )}
        </div>
        <button
          onClick={clearToast}
          className="shrink-0 rounded-tag p-0.5 opacity-60 transition-all hover:bg-black/5 hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}