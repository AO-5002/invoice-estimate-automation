"use client";

import { useState, useMemo, useCallback } from "react";
import { useInvoices, type InvoiceRecord } from "../hooks/useInvoices";
import RecordTable, { type Column } from "./RecordTable";
import type { SortSpec, SortField } from "./ActionsBar";
import { compareDates, formatCurrency, parseCurrencyAmount } from "../lib/format";

export const INVOICE_COLUMNS: Column<InvoiceRecord>[] = [
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

  const updateRecord = useCallback(
    (id: string, key: string, value: string) => {
      setInvoices((prev) =>
        prev.map((r) =>
          r.invoiceNumber === id
            ? ({ ...r, [key]: value } as InvoiceRecord)
            : r,
        ),
      );
    },
    [],
  );

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
    <RecordTable<InvoiceRecord>
      columns={visibleColumns}
      data={processedData}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No invoices yet"
      errorMessage="Failed to load invoices. Please try again later."
      locked={locked}
      identifierKey="invoiceNumber"
      onCellEdit={updateRecord}
    />
  );
}
