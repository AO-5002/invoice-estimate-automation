"use client";

import { useMemo } from "react";
import { useEstimates, type EstimateRecord } from "../hooks/useEstimates";
import RecordTable, { type Column } from "./RecordTable";
import type { SortSpec, SortField } from "./ActionsBar";

function formatCurrency(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(String(value));
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

export const ESTIMATE_COLUMNS: Column<EstimateRecord>[] = [
  { key: "estimateNumber", label: "Estimate #" },
  { key: "estimateDate", label: "Date Sent to Client" },
  { key: "client", label: "Client" },
  { key: "property", label: "Property" },
  { key: "projectDescription", label: "Description" },
  { key: "costToClient", label: "Cost", format: formatCurrency },
  { key: "approved", label: "Approved" },
  { key: "administrativeNotes", label: "Admin Notes" },
];

export const ESTIMATE_SORT_FIELDS: SortField[] = [
  { key: "estimateDate", label: "Date" },
  { key: "costToClient", label: "Cost" },
  { key: "client", label: "Client" },
  { key: "approved", label: "Status" },
  { key: "estimateNumber", label: "Estimate #" },
];

const SEARCH_KEYS: (keyof EstimateRecord)[] = [
  "client",
  "projectDescription",
  "property",
  "estimateNumber",
  "administrativeNotes",
];

function compareField(
  a: EstimateRecord,
  b: EstimateRecord,
  key: string,
): number {
  const av = a[key as keyof EstimateRecord] ?? "";
  const bv = b[key as keyof EstimateRecord] ?? "";
  if (key === "costToClient") {
    return (parseFloat(String(av)) || 0) - (parseFloat(String(bv)) || 0);
  }
  return String(av).localeCompare(String(bv));
}

export default function EstimateView({
  searchQuery = "",
  hiddenColumns,
  sortSpec,
}: {
  searchQuery?: string;
  hiddenColumns?: Set<string>;
  sortSpec?: SortSpec;
}) {
  const { estimates, isLoading, isError } = useEstimates();

  const processedData = useMemo(() => {
    let result = estimates;

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
  }, [estimates, searchQuery, sortSpec]);

  const visibleColumns = useMemo(() => {
    if (!hiddenColumns || hiddenColumns.size === 0) return ESTIMATE_COLUMNS;
    return ESTIMATE_COLUMNS.filter((c) => !hiddenColumns.has(c.key));
  }, [hiddenColumns]);

  return (
    <RecordTable<EstimateRecord>
      columns={visibleColumns}
      data={processedData}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No estimates yet"
      errorMessage="Failed to load estimates. Please try again later."
    />
  );
}
