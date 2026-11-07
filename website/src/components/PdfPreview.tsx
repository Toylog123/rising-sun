import { useEffect, useState } from "react";
import { X, Download, ExternalLink, FileText, Loader2, RefreshCw, Clock } from "lucide-react";
import { pagesUrl, rawUrl, formatBytes } from "@/lib/uploads";
import type { MeetingAttachment } from "@/lib/uploads";

interface PdfPreviewProps {
  attachment: MeetingAttachment | null;
  onClose: () => void;
}

/** 预览状态：检查中 / 可预览 / Pages 还没构建出这个文件 */
type ViewState = "checking" | "ready" | "pending";

/**
 * PDF 预览弹窗
 *
 * 预览用 GitHub Pages 直链（application/pdf，能被 iframe 内嵌渲染）；
 * 下载用 raw 直链（不受 Pages 的 10 分钟缓存影响，上传后立刻就能下到最新版）。
 */
export default function PdfPreview({ attachment, onClose }: PdfPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("checking");
  const [nonce, setNonce] = useState(0);

  const path = attachment?.path ?? null;

  // 每次打开或换文件，先探一下 Pages 上有没有这个文件
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoaded(false);
    setFailed(false);
    setViewState("checking");
    (async () => {
      try {
        const res = await fetch(pagesUrl(path), { method: "HEAD", cache: "no-store" });
        if (cancelled) return;
        // Pages 重新构建需要一两分钟，刚上传完可能还 404
        setViewState(res.ok ? "ready" : "pending");
      } catch {
        if (!cancelled) setViewState("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  useEffect(() => {
    if (!attachment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attachment, onClose]);

  if (!attachment) return null;

  const viewUrl = pagesUrl(attachment.path);
  const dlUrl = rawUrl(attachment.path);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white border border-[#e8e4db] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#f0ece4]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#c96442] text-white shrink-0">
              <FileText size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a] truncate">{attachment.name}</p>
              <p className="text-xs text-[#9a9590]">{formatBytes(attachment.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={dlUrl}
              download={attachment.name}
              title="下载 PDF"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e4db] bg-white px-3 py-1.5 text-sm text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#c96442] transition-colors"
            >
              <Download size={14} />
              下载
            </a>
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="在新标签页打开"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e4db] bg-white px-3 py-1.5 text-sm text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#c96442] transition-colors"
            >
              <ExternalLink size={14} />
              新标签页
            </a>
            <button
              onClick={onClose}
              className="text-[#9a9590] hover:text-[#1a1a1a] transition-colors p-1"
              title="关闭"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-[#f0ece4]">
          {viewState === "checking" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#6b6560]">
              <Loader2 size={22} className="animate-spin text-[#c96442]" />
              <p className="text-sm">正在检查文件…</p>
            </div>
          ) : viewState === "pending" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <Clock size={28} className="text-[#9a9590]" />
              <p className="text-sm text-[#6b6560]">
                Pages 还没把这个文件发布出来（GitHub Pages 重新构建通常需要一两分钟）
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNonce((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#6b6560] hover:border-[#c96442]/40 hover:text-[#c96442] transition-colors"
                >
                  <RefreshCw size={14} />
                  重新检查
                </button>
                <a
                  href={dlUrl}
                  download={attachment.name}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white"
                >
                  <Download size={14} />
                  直接下载
                </a>
              </div>
            </div>
          ) : !failed ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#6b6560]">
                  <Loader2 size={22} className="animate-spin text-[#c96442]" />
                  <p className="text-sm">正在加载 PDF…</p>
                </div>
              )}
              <iframe
                key={attachment.path}
                src={viewUrl}
                title={attachment.name}
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                className={`w-full h-full border-0 ${loaded ? "opacity-100" : "opacity-0"} transition-opacity`}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <FileText size={28} className="text-[#9a9590]" />
              <p className="text-sm text-[#6b6560]">
                预览失败（Pages 重新构建可能需要一两分钟），可以直接下载查看
              </p>
              <a
                href={dlUrl}
                download={attachment.name}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white"
              >
                <Download size={14} />
                下载 PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
