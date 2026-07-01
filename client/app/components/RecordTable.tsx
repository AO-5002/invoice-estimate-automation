"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  Loader2,
} from "lucide-react";
import Modal from "./Modal";
import { fetchBlob } from "../lib/fetcher";

const PAGE_SIZE = 10;

export interface Column<T> {
  key: keyof T & string;
  label: string;
  format?: (value: T[keyof T], record: T) => string;
  editable?: "text" | "number" | "date";
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
  locked = true,
  identifierKey,
  onCellEdit,
  pdfPath,
}: {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
  errorMessage: string;
  locked?: boolean;
  identifierKey?: string;
  onCellEdit?: (
    identifierValue: string,
    columnKey: string,
    value: string,
  ) => void;
  /** Builds the PDF endpoint for a given row id. When provided, a hover
   *  action to generate a PDF is rendered in a left gutter column. */
  pdfPath?: (id: string) => string;
}) {
  // The gutter icon needs both a way to build the endpoint and a row id.
  const showGutter = !!pdfPath && !!identifierKey;
  const [page, setPage] = useState(0);
  const prevLengthRef = useRef(data.length);
  useEffect(() => {
    if (prevLengthRef.current !== data.length) {
      setPage(0);
      prevLengthRef.current = data.length;
    }
  }, [data.length]);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pageData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const cancelledRef = useRef(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    id: string | null;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Transient bottom toast, reused for the "coming soon" stub and PDF errors.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The row id whose "Generate PDF?" confirm dialog is open, and whether the
  // PDF request is currently in flight.
  const [pdfTarget, setPdfTarget] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (locked && editingCell !== null) setEditingCell(null);
  if (locked && contextMenu !== null) setContextMenu(null);

  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setContextMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  function showComingSoon() {
    showToast("Coming soon");
  }

  function handleMenuAction() {
    setContextMenu(null);
    showComingSoon();
  }

  function openPdfConfirm(id: string) {
    setContextMenu(null);
    setPdfTarget(id);
  }

  async function handleGeneratePdf() {
    if (!pdfPath || pdfTarget == null) return;
    setPdfLoading(true);
    try {
      const blob = await fetchBlob(pdfPath(pdfTarget));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setPdfTarget(null);
    } catch {
      showToast("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  const canEdit = !locked && !!onCellEdit && !!identifierKey;

  function startEdit(rowIndex: number, col: Column<T>, record: T) {
    if (!canEdit || !col.editable) return;
    cancelledRef.current = false;
    setEditingCell({ row: rowIndex, col: col.key });
    const raw = record[col.key];
    setEditValue(raw == null ? "" : String(raw));
  }

  function handleEditBlur() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setEditingCell(null);
      return;
    }
    if (!editingCell || !canEdit) {
      setEditingCell(null);
      return;
    }
    const record = pageData[editingCell.row];
    if (!record) {
      setEditingCell(null);
      return;
    }
    const id = String(record[identifierKey as keyof T]);
    const val = editValue.trim();
    if (editingCell.col === identifierKey && val === "") {
      setEditingCell(null);
      return;
    }
    onCellEdit!(id, editingCell.col, val);
    setEditingCell(null);
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#313131]">
                {showGutter && <th className="w-10 px-2 py-3" />}
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
                  {showGutter && <td className="w-10 px-2 py-3" />}
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
    <div className="relative flex flex-1 flex-col rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] overflow-hidden">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#313131]">
              {showGutter && <th className="w-10 px-2 py-3" />}
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
            {pageData.map((record, i) => {
              const rowId = identifierKey
                ? String(record[identifierKey as keyof T])
                : null;
              return (
              <tr
                key={i}
                className="group border-b border-[#313131]/50 transition-colors hover:bg-[#1e1e1e]"
                onContextMenu={(e) => {
                  if (locked) return;
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, id: rowId });
                }}
              >
                {showGutter && (
                  <td className="w-10 px-2 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => rowId && openPdfConfirm(rowId)}
                      aria-label="Generate PDF"
                      className="flex items-center justify-center text-[#989898] opacity-0 transition group-hover:opacity-100 hover:text-[#7987FF]"
                    >
                      <FileText className="size-4" />
                    </button>
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[13px] text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                  >
                    {editingCell?.row === i &&
                    editingCell?.col === col.key ? (
                      <input
                        autoFocus
                        type={col.editable}
                        step={col.editable === "number" ? "0.01" : undefined}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            cancelledRef.current = true;
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onBlur={handleEditBlur}
                        className="w-full bg-[#1e1e1e] border border-[#7987FF] rounded px-1 py-0.5 text-[13px] text-white outline-none"
                      />
                    ) : (
                      <span
                        onClick={
                          canEdit && col.editable
                            ? () => startEdit(i, col, record)
                            : undefined
                        }
                        className={
                          canEdit && col.editable ? "cursor-text" : ""
                        }
                      >
                        {col.format
                          ? col.format(record[col.key], record)
                          : defaultFormat(record[col.key])}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              );
            })}
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

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] rounded-[8px] border border-[#313131] bg-[#232323] py-1 shadow-lg"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 130),
          }}
        >
          <button
            onClick={() => {
              if (showGutter && contextMenu.id) {
                openPdfConfirm(contextMenu.id);
              } else {
                handleMenuAction();
              }
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-white/70 transition-colors hover:bg-[#1e1e1e] hover:text-white"
          >
            <FileText className="size-3.5" />
            Generate PDF
          </button>
          <button
            onClick={handleMenuAction}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-white/70 transition-colors hover:bg-[#1e1e1e] hover:text-white"
          >
            <Copy className="size-3.5" />
            Duplicate
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-[8px] border border-[#313131] bg-[#232323] px-4 py-2 text-[13px] text-[#989898] shadow-lg">
          {toast}
        </div>
      )}

      <Modal
        open={pdfTarget !== null}
        onClose={() => {
          if (!pdfLoading) setPdfTarget(null);
        }}
        title="Generate PDF"
      >
        <p className="text-[14px] leading-[20px] text-[#c9c9c9]">
          Generate a PDF for this row?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setPdfTarget(null)}
            disabled={pdfLoading}
            className="rounded-[8px] border border-[#313131] px-4 py-2 text-[13px] text-[#989898] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 rounded-[8px] bg-[#7987FF] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pdfLoading && <Loader2 className="size-4 animate-spin" />}
            {pdfLoading ? "Generating…" : "Confirm"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
