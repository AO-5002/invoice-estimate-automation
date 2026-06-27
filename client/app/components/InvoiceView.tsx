"use client";

import { useInvoices, type InvoiceRecord } from "../hooks/useInvoices";
import RecordTable, { type Column } from "./RecordTable";

function formatCurrency(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(String(value));
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

const COLUMNS: Column<InvoiceRecord>[] = [
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

export default function InvoiceView() {
  const { invoices, isLoading, isError } = useInvoices();

  return (
    <RecordTable<InvoiceRecord>
      columns={COLUMNS}
      data={invoices}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No invoices yet"
      errorMessage="Failed to load invoices. Please try again later."
    />
  );
}
