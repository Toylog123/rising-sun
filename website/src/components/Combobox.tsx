import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";

export interface ComboboxGroup {
  label: string;
  icon?: ReactNode;
  options: string[];
}

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  groups?: ComboboxGroup[];
  options?: string[];
  allowCustom?: boolean;
  className?: string;
}

interface FlatItem {
  value: string;
  groupLabel: string;
  groupIcon?: ReactNode;
}

export default function Combobox({
  value,
  onChange,
  placeholder,
  groups,
  options,
  allowCustom = true,
  className = "",
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(value), [value]);

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

  const all: FlatItem[] = (() => {
    if (groups) {
      return groups.flatMap((g) =>
        g.options.map((o) => ({ value: o, groupLabel: g.label, groupIcon: g.icon }))
      );
    }
    return (options ?? []).map((o) => ({ value: o, groupLabel: "" }));
  })();

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((x) => x.value.toLowerCase().includes(q));
  })();

  const canCreate = allowCustom && query.trim() && !all.some((x) => x.value === query.trim());
  const totalItems = filtered.length + (canCreate ? 1 : 0);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => (h + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => (h - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!open) return;
      const items = canCreate ? [...filtered, { value: query.trim(), groupLabel: "__new__" }] : filtered;
      const pick = items[highlight];
      if (pick) {
        onChange(pick.value);
        setQuery(pick.value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const choose = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center rounded-xl border bg-white transition-all ${
          open
            ? "border-[#c96442]/40 ring-2 ring-[#c96442]/10"
            : "border-[#e8e4db] hover:border-[#c96442]/30"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setHighlight(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            // 阻止 button 获取焦点，避免 input.onFocus 强制重开
            e.preventDefault();
          }}
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-2.5 text-[#6b6560] hover:text-[#c96442] transition-colors"
          tabIndex={-1}
          title={open ? "收起候选" : "展开候选"}
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? "rotate-180 text-[#c96442]" : ""}`}
          />
        </button>
      </div>

      {open && totalItems > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-[#e8e4db] bg-white shadow-xl shadow-[#c96442]/5">
          {(() => {
            const groupsView = new Map<string, FlatItem[]>();
            const groupIcons = new Map<string, ReactNode>();
            filtered.forEach((it) => {
              if (!groupsView.has(it.groupLabel)) {
                groupsView.set(it.groupLabel, []);
                groupIcons.set(it.groupLabel, it.groupIcon);
              }
              groupsView.get(it.groupLabel)!.push(it);
            });

            let runningIdx = 0;

            return (
              <>
                {Array.from(groupsView.entries()).map(([gLabel, items]) => (
                  <div key={gLabel} className="py-1">
                    {gLabel && (
                      <div className="px-3.5 pt-1.5 pb-1 text-xs font-semibold text-[#9a9590] flex items-center gap-1.5">
                        {groupIcons.get(gLabel)}
                        {gLabel}
                      </div>
                    )}
                    {items.map((it) => {
                      const myIdx = runningIdx++;
                      const isSelected = it.value === value;
                      const isHighlight = myIdx === highlight;
                      return (
                        <button
                          key={it.value}
                          type="button"
                          onMouseEnter={() => setHighlight(myIdx)}
                          onClick={() => choose(it.value)}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                            isHighlight
                              ? "bg-[#c96442]/10 text-[#1a1a1a]"
                              : "text-[#4a4540] hover:bg-[#faf9f5]"
                          }`}
                        >
                          <span className={isSelected ? "font-medium text-[#c96442]" : ""}>{it.value}</span>
                          {isSelected && <Check size={14} className="text-[#c96442]" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {canCreate && (
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(filtered.length)}
                    onClick={() => choose(query.trim())}
                    className={`flex w-full items-center gap-2 border-t border-[#f0ece4] px-3.5 py-2.5 text-sm transition-colors ${
                      highlight === filtered.length
                        ? "bg-[#c96442]/10 text-[#1a1a1a]"
                        : "text-[#c96442] hover:bg-[#faf9f5]"
                    }`}
                  >
                    <Plus size={14} />
                    <span>
                      新增「<strong>{query.trim()}</strong>」
                    </span>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}