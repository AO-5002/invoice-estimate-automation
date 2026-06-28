"use client";

import { useMemo } from "react";
import { useInvoices, type InvoiceRecord } from "../hooks/useInvoices";
import RecordTable, { type Column } from "./RecordTable";
import type { SortSpec, SortField } from "./ActionsBar";

function formatCurrency(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(String(value));
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

export const INVOICE_COLUMNS: Column<InvoiceRecord>[] = [
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "client", label: "Client" },
  { key: "invoiceDate", label: "Invoice Date" },
  { key: "paymentDue", label: "Payment Due" },
  { key: "completionStatus", label: "Status" },
  { key: "estimateReference", label: "Est. Ref" },
  { key: "costToClient", label: "Cost", format: formatCurrency },
  { key: "property", label: "Property" },
  { key: "projectDescription", label: "Description" },
  { key: "serviceCategories", label: "Services" },
];

export const INVOICE_SORT_FIELDS: SortField[] = [
  { key: "invoiceDate", label: "Date" },
  { key: "costToClient", label: "Cost" },
  { key: "client", label: "Client" },
  { key: "completionStatus", label: "Status" },
  { key: "invoiceNumber", label: "Invoice #" },
];

const SEARCH_KEYS: (keyof InvoiceRecord)[] = [
  "client",
  "projectDescription",
  "property",
  "invoiceNumber",
  "administrativeNotes",
];

function compareField(
  a: InvoiceRecord,
  b: InvoiceRecord,
  key: string,
): number {
  const av = a[key as keyof InvoiceRecord] ?? "";
  const bv = b[key as keyof InvoiceRecord] ?? "";
  if (key === "costToClient") {
    return (parseFloat(String(av)) || 0) - (parseFloat(String(bv)) || 0);
  }
  return String(av).localeCompare(String(bv));
}

export default function InvoiceView({
  searchQuery = "",
  hiddenColumns,
  sortSpec,
}: {
  searchQuery?: string;
  hiddenColumns?: Set<string>;
  sortSpec?: SortSpec;
}) {
  const { invoices, isLoading, isError } = useInvoices();

  const processedData = useMemo(() => {
    let result = invoices;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        SEARCH_KEYS.some((k) => String(r[k]).toLowerCase().includes(q)),
      );
    }

    if (sortSpec) {
      result = [...result].sort((a, b) => {
        const cmp = compareField(a, b, sortSpec.key);
        return sortSpec.direction === "asc" ? cmp : -cmp;
      });
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
    />
  );
}
