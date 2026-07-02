"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { mutate } from "swr";
import { useInvoices, type InvoiceRecord } from "../hooks/useInvoices";
import RecordTable, { type Column } from "./RecordTable";
import type { SortSpec, SortField } from "./ActionsBar";
import { compareDates, formatCurrency, parseCurrencyAmount } from "../lib/format";
import { patchJSON } from "../lib/fetcher";
import { buildPdfFilename } from "../lib/download";

export const INVOICE_COLUMNS: Column<InvoiceRecord>[] = [
  { key: "id", label: "ID" },
  { key: "invoiceNumber", label: "Invoice #", editable: "text" },
  { key: "client", label: "Client", editable: "text" },
  { key: "invoiceDate", label: "Invoice Date", editable: "date" },
  { key: "paymentDue", label: "Payment Due", editable: "date" },
  { key: "paymentStatus", label: "Payment Status", editable: "text" },
  { key: "estimateReference", label: "Est. Ref", editable: "text" },
  {
    key: "costToClient",
    label: "Cost",
    format: formatCurrency,
    editable: "number",
  },
  { key: "property", label: "Property", editable: "text" },
  { key: "projectDescription", label: "Description", editable: "text" },
  { key: "serviceCategories", label: "Services" },
];

export const INVOICE_SORT_FIELDS: SortField[] = [
  { key: "invoiceDate", label: "Date" },
  { key: "costToClient", label: "Cost" },
  { key: "client", label: "Client" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "invoiceNumber", label: "Invoice #" },
];

const SEARCH_KEYS: (keyof InvoiceRecord)[] = [
  "client",
  "projectDescription",
  "property",
  "invoiceNumber",
  "administrativeNotes",
  "paymentStatus",
];

function compareField(
  a: InvoiceRecord,
  b: InvoiceRecord,
  key: string,
  direction: SortSpec["direction"],
): number {
  if (key === "invoiceDate") {
    return compareDates(a.invoiceDate, b.invoiceDate, direction);
  }
  const av = a[key as keyof InvoiceRecord] ?? "";
  const bv = b[key as keyof InvoiceRecord] ?? "";
  const cmp =
    key === "costToClient"
      ? (parseCurrencyAmount(av) || 0) - (parseCurrencyAmount(bv) || 0)
      : String(av).localeCompare(String(bv));
  return direction === "asc" ? cmp : -cmp;
}

export default function InvoiceView({
  searchQuery = "",
  hiddenColumns,
  sortSpec,
  locked = true,
}: {
  searchQuery?: string;
  hiddenColumns?: Set<string>;
  sortSpec?: SortSpec;
  locked?: boolean;
}) {
  const { invoices: initialInvoices, isLoading, isError } = useInvoices();
  // local-only mutable state, re-seeded when the fetched data changes
  // (initialInvoices is `[]` on the first render while SWR is still loading).
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [seededFrom, setSeededFrom] = useState(initialInvoices);
  if (seededFrom !== initialInvoices) {
    setSeededFrom(initialInvoices);
    setInvoices(initialInvoices);
  }

  const [editError, setEditError] = useState<string | null>(null);
  useEffect(() => {
    if (!editError) return;
    const t = setTimeout(() => setEditError(null), 3000);
    return () => clearTimeout(t);
  }, [editError]);

  const updateRecord = useCallback((id: string, key: string, value: string) => {
    // Optimistically apply the edit locally...
    setInvoices((prev) =>
      prev.map((r) =>
        r.id === id ? ({ ...r, [key]: value } as InvoiceRecord) : r,
      ),
    );
    // ...then persist that single cell. Revalidate on success; on failure
    // revalidate too (restoring the server's truth) and surface the error.
    patchJSON(`/api/invoices/${id}`, { key, value })
      .then(() => mutate("/api/invoices"))
      .catch(() => {
        setEditError("Failed to save change. Reverting.");
        mutate("/api/invoices");
      });
  }, []);

  const processedData = useMemo(() => {
    let result = invoices;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        SEARCH_KEYS.some((k) => String(r[k]).toLowerCase().includes(q)),
      );
    }

    if (sortSpec) {
      result = [...result].sort((a, b) =>
        compareField(a, b, sortSpec.key, sortSpec.direction),
      );
    }

    return result;
  }, [invoices, searchQuery, sortSpec]);

  const visibleColumns = useMemo(() => {
    if (!hiddenColumns || hiddenColumns.size === 0) return INVOICE_COLUMNS;
    return INVOICE_COLUMNS.filter((c) => !hiddenColumns.has(c.key));
  }, [hiddenColumns]);

  return (
    <>
      <RecordTable<InvoiceRecord>
        columns={visibleColumns}
        data={processedData}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No invoices yet"
        errorMessage="Failed to load invoices. Please try again later."
        locked={locked}
        identifierKey="id"
        onCellEdit={updateRecord}
        pdfDownload={(invoice) => {
          // The PDF endpoint keys off invoiceNumber, so without it there's
          // nothing to request — signal `null` to disable the row button.
          if (!invoice.invoiceNumber) return null;
          return {
            url: `/api/invoices/${encodeURIComponent(invoice.invoiceNumber)}/pdf`,
            filename: buildPdfFilename(
              invoice.client,
              "INVOICE",
              invoice.invoiceNumber,
            ),
          };
        }}
      />
      {editError && (
        <div
          role="alert"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-[8px] border border-[#313131] bg-[#232323] px-4 py-2 text-[13px] text-[#FFA5CB] shadow-lg"
        >
          {editError}
        </div>
      )}
    </>
  );
}
