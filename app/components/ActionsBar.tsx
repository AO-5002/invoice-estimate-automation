import { ArrowUpDown, ListFilter, Search } from "lucide-react";

export default function ActionsBar({ label }: { label?: string }) {
  return (
    <div className={`flex items-center py-[10px] ${label ? "justify-between" : "justify-end"}`}>
      {label && (
        <p className="text-[15px] leading-[20px] tracking-[-0.23px] text-white/40">
          {label}
        </p>
      )}
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
