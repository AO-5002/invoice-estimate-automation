"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUpDown,
  ListFilter,
  Search,
  Plus,
  ChevronDown,
} from "lucide-react";

type View = "agent" | "invoice" | "estimate";

const VIEW_LABELS: Record<View, string> = {
  agent: "Agent View",
  invoice: "Invoice View",
  estimate: "Estimate View",
};

export default function ActionsBar({
  label,
  view,
  onViewChange,
  onCreate,
}: {
  label?: string;
  view?: View;
  onViewChange?: (v: View) => void;
  onCreate?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const hasViewSwitcher = view !== undefined && onViewChange !== undefined;

  return (
    <div
      className={`flex items-center py-[10px] ${hasViewSwitcher || label ? "justify-between" : "justify-end"}`}
    >
      <div className="flex items-center gap-[14px]">
        {onCreate && (
          <button
            onClick={onCreate}
            className="text-white hover:text-white/80 transition-colors"
          >
            <Plus className="size-[15px]" />
          </button>
        )}

        {hasViewSwitcher ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[15px] leading-[20px] tracking-[-0.23px] text-white/40 transition-colors hover:text-white/60"
            >
              {VIEW_LABELS[view]}
              <ChevronDown className="size-3.5" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-[8px] border border-[#313131] bg-[#232323] py-1 shadow-lg">
                {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      onViewChange(v);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                      v === view
                        ? "text-[#7987FF]"
                        : "text-white/70 hover:bg-[#1e1e1e] hover:text-white"
                    }`}
                  >
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          label && (
            <p className="text-[15px] leading-[20px] tracking-[-0.23px] text-white/40">
              {label}
            </p>
          )
        )}
      </div>

      <div className="flex items-center gap-[22px]">
        <button className="text-white hover:text-white/80 transition-colors">
          <ArrowUpDown className="size-[15px]" />
        </button>
        <button className="text-white hover:text-white/80 transition-colors">
          <ListFilter className="size-[15px]" />
        </button>
        <div className="flex items-center gap-[10px] text-white/40">
          <Search className="size-[15px]" />
          <span className="text-[13px] leading-[18px] tracking-[-0.08px]">
            Search
          </span>
        </div>
      </div>
    </div>
  );
}
