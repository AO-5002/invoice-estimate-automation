"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export interface Column<T> {
  key: keyof T & string;
  label: string;
  format?: (value: T[keyof T], record: T) => string;
}

function defaultFormat(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

export default function RecordTable<T extends object>({
  columns,
  data,
  isLoading,
  isError,
  emptyMessage,
  errorMessage,
}: {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
  errorMessage: string;
}) {
  const [page, setPage] = useState(0);
  const prevDataRef = useRef(data);
  useEffect(() => {
    if (prevDataRef.current !== data) {
      setPage(0);
      prevDataRef.current = data;
    }
  }, [data]);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pageData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#313131]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-[12px] font-medium text-[#989898]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#313131]/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-[#313131]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] p-10">
        <p className="text-[15px] text-[#989898]">{errorMessage}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] p-10">
        <p className="text-[15px] text-[#989898]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] overflow-hidden">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#313131]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[12px] font-medium text-[#989898]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((record, i) => (
              <tr
                key={i}
                className="border-b border-[#313131]/50 transition-colors hover:bg-[#1e1e1e]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[13px] text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                  >
                    {col.format
                      ? col.format(record[col.key], record)
                      : defaultFormat(record[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#313131] px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-[13px] text-[#989898] transition-colors hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
            Prev
          </button>
          <span className="text-[13px] text-[#989898]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-[13px] text-[#989898] transition-colors hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
