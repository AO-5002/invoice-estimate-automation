"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const PAGES = [
  { label: "Quotes & Invoices", href: "/quotes-invoices" },
  { label: "Transaction Record", href: "/transaction-record" },
];

export default function PageTitleNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = PAGES.find((p) => pathname.startsWith(p.href)) ?? PAGES[0];

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[34px] leading-[41px] tracking-[0.4px] text-white"
      >
        {current.label}
        <ChevronDown className="size-6 text-white" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-10 rounded-md border border-[#313131] bg-[#232323] py-1">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              onClick={() => setOpen(false)}
              className={`block w-full px-5 py-2.5 text-left text-[16px] text-white whitespace-nowrap transition-colors ${
                page.href === current.href
                  ? "bg-[#313131]"
                  : "hover:bg-[#2a2a2a]"
              }`}
            >
              {page.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
