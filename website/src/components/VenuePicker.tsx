import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { venueList } from "@/data/degreeAwards";

interface VenuePickerProps {
  kind: "期刊" | "会议";
  /** 当前选中的目录 key（空 = 未选） */
  value: string;
  onChange: (key: string, v: { name: string; kind: "期刊" | "会议" }) => void;
  className: string;
  placeholder?: string;
}

/**
 * 成果录入用的刊会选择器。
 *
 * 目录有 700+ 条，全塞进 <select> 会让 bundle 变大、展开也难找，
 * 所以做成「搜索框 + 结果列表」，只在输入后才渲染候选。
 */
export default function VenuePicker({
  kind, value, onChange, className, placeholder,
}: VenuePickerProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const selected = value ? venueList.find((v) => v.key === value) : undefined;

  const matches = useMemo(() => {
    const key = q.trim().toLowerCase();
    const pool = venueList.filter((v) => v.kind === kind);
    if (!key) return pool.slice(0, 30);
    return pool
      .filter(
        (v) =>
          v.abbr.toLowerCase().includes(key) ||
          v.name.toLowerCase().includes(key),
      )
      .slice(0, 30);
  }, [q, kind]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9590]" />
          <input
            value={open ? q : selected ? `${selected.abbr}${selected.name !== selected.abbr ? ` — ${selected.name}` : ""}` : ""}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setQ("");
              setOpen(true);
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder ?? (kind === "期刊" ? "搜索期刊（如 TCAD、电子学报）" : "搜索会议（如 DAC、ICCAD）")}
            // 左侧留出图标的位置：传入的 className 自带 px-3.5，不覆盖的话文字会压到放大镜上
            style={{ paddingLeft: "2.25rem" }}
            className={className}
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("", { name: "", kind })}
            className="shrink-0 rounded-lg border border-[#e8e4db] px-2.5 py-2 text-xs text-[#6b6560] hover:border-[#c96442]/40"
          >
            清除
          </button>
        )}
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8e4db] bg-white shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-xs text-[#9a9590]">没有匹配的条目，可直接在下方手填全称</li>
          ) : (
            matches.map((v) => (
              <li key={v.key}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(v.key, { name: v.name, kind: v.kind });
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#faf9f5]"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-[#1a1a1a]">{v.abbr}</span>
                    {v.name !== v.abbr && (
                      <span className="ml-1.5 text-xs text-[#9a9590]">{v.name}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-[#c96442]">
                    {v.tier1 ? "一类目录" : ""}
                    {!v.tier1 && v.ccf ? `CCF ${v.ccf}` : ""}
                    {!v.tier1 && !v.ccf && v.tj ? v.tj : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}