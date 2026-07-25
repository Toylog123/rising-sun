import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useUIStore, type ToastKind } from "@/store/ui";

const ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLE: Record<ToastKind, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
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
    <div className="fixed top-20 right-4 z-[300] max-w-sm pointer-events-none">
      <div
        className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${style} pointer-events-auto animate-[slideIn_200ms_ease-out]`}
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
          className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}