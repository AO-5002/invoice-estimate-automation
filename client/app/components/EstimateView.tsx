"use client";

import { useEstimates, type EstimateRecord } from "../hooks/useEstimates";
import RecordTable, { type Column } from "./RecordTable";

function formatCurrency(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(String(value));
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

const COLUMNS: Column<EstimateRecord>[] = [
  { key: "estimateNumber", label: "Estimate #" },
  { key: "estimateDate", label: "Date Sent to Client" },
  { key: "client", label: "Client" },
  { key: "property", label: "Property" },
  { key: "projectDescription", label: "Description" },
  { key: "costToClient", label: "Cost", format: formatCurrency },
  { key: "approved", label: "Approved" },
  { key: "administrativeNotes", label: "Admin Notes" },
];

export default function EstimateView() {
  const { estimates, isLoading, isError } = useEstimates();

  return (
    <RecordTable<EstimateRecord>
      columns={COLUMNS}
      data={estimates}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No estimates yet"
      errorMessage="Failed to load estimates. Please try again later."
    />
  );
}
