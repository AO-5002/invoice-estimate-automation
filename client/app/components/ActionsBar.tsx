"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUpDown,
  ListFilter,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  LockOpen,
} from "lucide-react";

type View = "agent" | "invoice" | "estimate";

const VIEW_LABELS: Record<View, string> = {
  agent: "Agent View",
  invoice: "Invoice View",
  estimate: "Estimate View",
};

export interface SortSpec {
  key: string;
  direction: "asc" | "desc";
}

export interface SortField {
  key: string;
  label: string;
}

export interface ColumnDef {
  key: string;
  label: string;
}

type OpenMenu = "view" | "sort" | "filter" | null;

export default function ActionsBar({
  label,
  view,
  onViewChange,
  onCreate,
  searchQuery,
  onSearchChange,
  columns,
  hiddenColumns,
  onToggleColumn,
  sortFields,
  sortSpec,
  onSortChange,
  locked,
  onToggleLock,
}: {
  label?: string;
  view?: View;
  onViewChange?: (v: View) => void;
  onCreate?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  columns?: ColumnDef[];
  hiddenColumns?: Set<string>;
  onToggleColumn?: (key: string) => void;
  sortFields?: SortField[];
  sortSpec?: SortSpec;
  onSortChange?: (spec: SortSpec) => void;
  locked?: boolean;
  onToggleLock?: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      const refs = { view: viewRef, sort: sortRef, filter: filterRef };
      const activeRef = refs[openMenu!];
      if (activeRef.current && !activeRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openMenu]);

  function toggleMenu(menu: OpenMenu) {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  }

  const hasViewSwitcher = view !== undefined && onViewChange !== undefined;
  const hasSearch = searchQuery !== undefined && onSearchChange !== undefined;
  const hasFilter =
    columns !== undefined &&
    hiddenColumns !== undefined &&
    onToggleColumn !== undefined;
  const hasSort =
    sortFields !== undefined &&
    sortSpec !== undefined &&
    onSortChange !== undefined;

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
          <div className="relative" ref={viewRef}>
            <button
              onClick={() => toggleMenu("view")}
              className="flex items-center gap-1.5 text-[15px] leading-[20px] tracking-[-0.23px] text-white/40 transition-colors hover:text-white/60"
            >
              {VIEW_LABELS[view]}
              <ChevronDown className="size-3.5" />
            </button>
            {openMenu === "view" && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-[8px] border border-[#313131] bg-[#232323] py-1 shadow-lg">
                {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      onViewChange(v);
                      setOpenMenu(null);
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

      <div className="  flex justify-center items-start gap-[22px]">
        {/* Lock */}
        {locked !== undefined && onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`transition-colors ${locked ? "text-white/40 hover:text-white/60" : "text-[#7987FF] hover:text-[#7987FF]/80"}`}
            title={locked ? "Unlock editing" : "Lock editing"}
          >
            {locked ? (
              <Lock className="size-[15px]" />
            ) : (
              <LockOpen className="size-[15px]" />
            )}
          </button>
        )}

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={hasSort ? () => toggleMenu("sort") : undefined}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowUpDown className="size-[15px]" />
          </button>
          {hasSort && openMenu === "sort" && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-[8px] border border-[#313131] bg-[#232323] py-1 shadow-lg">
              {sortFields.map((f) => {
                const isActive = sortSpec.key === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => {
                      onSortChange({
                        key: f.key,
                        direction:
                          isActive && sortSpec.direction === "asc"
                            ? "desc"
                            : "asc",
                      });
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors ${
                      isActive
                        ? "text-[#7987FF]"
                        : "text-white/70 hover:bg-[#1e1e1e] hover:text-white"
                    }`}
                  >
                    {f.label}
                    {isActive &&
                      (sortSpec.direction === "asc" ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Column filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={hasFilter ? () => toggleMenu("filter") : undefined}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ListFilter className="size-[15px]" />
          </button>
          {hasFilter && openMenu === "filter" && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-[8px] border border-[#313131] bg-[#232323] py-1 shadow-lg">
              {columns.map((col, i) => {
                const isIdentifier = i === 0;
                const isVisible = !hiddenColumns.has(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={
                      isIdentifier ? undefined : () => onToggleColumn(col.key)
                    }
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
                      isIdentifier
                        ? "text-white/30 cursor-default"
                        : isVisible
                          ? "text-white/70 hover:bg-[#1e1e1e] hover:text-white"
                          : "text-white/30 hover:bg-[#1e1e1e] hover:text-white/50"
                    }`}
                  >
                    <span
                      className={`flex size-3.5 items-center justify-center rounded-sm border ${
                        isVisible
                          ? "border-[#7987FF] bg-[#7987FF]"
                          : "border-[#313131] bg-transparent"
                      }`}
                    >
                      {isVisible && <Check className="size-2.5 text-white" />}
                    </span>
                    {col.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search */}
        {hasSearch ? (
          <div className="flex items-center gap-[10px] text-white/40">
            <Search className="size-[15px] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-[13px] leading-[18px] tracking-[-0.08px] text-white outline-none placeholder-white/40 w-[120px]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-[10px] text-white/40">
            <Search className="size-[15px]" />
            <span className="text-[13px] leading-[18px] tracking-[-0.08px]">
              Search
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
