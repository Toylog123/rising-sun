import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * 长的纪要默认只显示开头几行，点「展开」看全文。
 *
 * 为什么要这个：组会纪要如果写得很细（像论文笔记），一页会被单条记录撑满，
 * 扫一眼就知道「这次谁讲了啥」变得很费劲。默认折叠 + 可展开，两种需求都能满足。
 */
const PREVIEW_LINES = 4;

export default function CollapsibleText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split("\n");
  const long = lines.length > PREVIEW_LINES;

  if (!long) {
    return <p className="text-sm text-[#4a4540] whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  return (
    <div>
      <p
        className={`text-sm text-[#4a4540] whitespace-pre-wrap leading-relaxed ${
          open ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-1 inline-flex items-center gap-1 text-xs text-[#c96442] hover:underline"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {open ? "收起" : `展开全文（${text.length} 字）`}
      </button>
    </div>
  );
}
