import { useEffect } from "react";
import { AlertTriangle, X, AlertCircle } from "lucide-react";
import { useUIStore } from "@/store/ui";

export default function Confirm() {
  const spec = useUIStore((s) => s.spec);
  const resolve = useUIStore((s) => s.resolveConfirm);

  // ESC 取消
  useEffect(() => {
    if (!spec) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resolve(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spec, resolve]);

  if (!spec) return null;

  const isDanger = spec.tone === "danger";
  const Icon = isDanger ? AlertTriangle : AlertCircle;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => resolve(false)}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white border border-[#e8e4db] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 pt-5 pb-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-red-50 text-red-600" : "bg-[#c96442]/10 text-[#c96442]"
            }`}
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-base font-semibold text-[#1a1a1a] leading-snug">
              {spec.title}
            </h3>
            {spec.description && (
              <p className="mt-1.5 text-sm text-[#6b6560] leading-relaxed whitespace-pre-line">
                {spec.description}
              </p>
            )}
          </div>
          <button
            onClick={() => resolve(false)}
            className="text-[#9a9590] hover:text-[#1a1a1a] transition-colors shrink-0"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-[#faf9f5] border-t border-[#f0ece4]">
          <button
            onClick={() => resolve(false)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
          >
            {spec.cancelText ?? "取消"}
          </button>
          <button
            onClick={() => resolve(true)}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition-all ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#c96442] hover:bg-[#b5573a]"
            }`}
          >
            {spec.confirmText ?? "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}