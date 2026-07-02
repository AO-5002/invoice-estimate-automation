"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { downloadFile } from "../lib/download";

const PAGE_SIZE = 10;

export interface Column<T> {
  key: keyof T & string;
  label: string;
  format?: (value: T[keyof T], record: T) => string;
  editable?: "text" | "number" | "date";
}

/** A per-row PDF download target: the endpoint to fetch and the filename to save it as. */
export interface PdfDownload {
  url: string;
  filename: string;
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
  pdfDownload,
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
  /**
   * Resolves the PDF download target for a row. Return `null` to disable the
   * button (e.g. the row is missing the number the endpoint keys off). When
   * provided, a PDF action is rendered in a left gutter column.
   */
  pdfDownload?: (record: T) => PdfDownload | null;
}) {
  const showGutter = !!pdfDownload;
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

  // Transient bottom toast, used to surface PDF generation errors.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Row keys with an in-flight PDF download, so each row's icon can show a
  // spinner and be disabled independently without blocking the other rows.
  const [pdfBusy, setPdfBusy] = useState<Set<string>>(new Set());

  if (locked && editingCell !== null) setEditingCell(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  /** Fetches the row's PDF and saves it to disk, tracking loading per row key. */
  async function handleDownloadPdf(rowKey: string, pdf: PdfDownload) {
    if (pdfBusy.has(rowKey)) return;
    setPdfBusy((prev) => new Set(prev).add(rowKey));
    try {
      await downloadFile(pdf.url, pdf.filename);
    } catch {
      showToast("Failed to generate PDF. Please try again.");
    } finally {
      setPdfBusy((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
    }
  }

  const canEdit = !locked && !!onCellEdit && !!identifierKey;

  function rowKeyOf(record: T, pageIndex: number, pdf: PdfDownload | null): string {
    if (identifierKey) return String(record[identifierKey as keyof T]);
    return pdf?.url ?? String(page * PAGE_SIZE + pageIndex);
  }

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
              const pdf = pdfDownload ? pdfDownload(record) : null;
              const rowKey = rowKeyOf(record, i, pdf);
              const busy = pdfBusy.has(rowKey);
              return (
                <tr
                  key={i}
                  className="border-b border-[#313131]/50 transition-colors hover:bg-[#1e1e1e]"
                >
                  {showGutter && (
                    <td className="w-10 px-2 py-3 align-middle">
                      <button
                        type="button"
                        onClick={() => pdf && handleDownloadPdf(rowKey, pdf)}
                        disabled={!pdf || busy}
                        aria-label={
                          pdf
                            ? `Download PDF (${pdf.filename})`
                            : "PDF unavailable — this row has no number"
                        }
                        title={
                          pdf
                            ? "Download PDF"
                            : "This row has no number to generate a PDF"
                        }
                        className={`flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
                          pdf
                            ? "text-[#989898] hover:text-[#7987FF]"
                            : "text-[#5a5a5a]"
                        }`}
                      >
                        {busy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileText className="size-4" />
                        )}
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

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-[8px] border border-[#313131] bg-[#232323] px-4 py-2 text-[13px] text-[#989898] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
