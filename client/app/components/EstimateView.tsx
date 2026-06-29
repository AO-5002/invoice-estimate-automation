"use client";

import { useState, useMemo, useCallback } from "react";
import { useEstimates, type EstimateRecord } from "../hooks/useEstimates";
import RecordTable, { type Column } from "./RecordTable";
import type { SortSpec, SortField } from "./ActionsBar";
import { compareDates, formatCurrency, parseCurrencyAmount } from "../lib/format";

export const ESTIMATE_COLUMNS: Column<EstimateRecord>[] = [
  { key: "estimateNumber", label: "Estimate #", editable: "text" },
  { key: "estimateDate", label: "Date Sent to Client", editable: "date" },
  { key: "client", label: "Client", editable: "text" },
  { key: "property", label: "Property", editable: "text" },
  { key: "projectDescription", label: "Description", editable: "text" },
  {
    key: "costToClient",
    label: "Cost",
    format: formatCurrency,
    editable: "number",
  },
  { key: "approved", label: "Approved", editable: "text" },
  { key: "administrativeNotes", label: "Admin Notes", editable: "text" },
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
  direction: SortSpec["direction"],
): number {
  if (key === "estimateDate") {
    return compareDates(a.estimateDate, b.estimateDate, direction);
  }
  const av = a[key as keyof EstimateRecord] ?? "";
  const bv = b[key as keyof EstimateRecord] ?? "";
  const cmp =
    key === "costToClient"
      ? (parseCurrencyAmount(av) || 0) - (parseCurrencyAmount(bv) || 0)
      : String(av).localeCompare(String(bv));
  return direction === "asc" ? cmp : -cmp;
}

export default function EstimateView({
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
  const { estimates: initialEstimates, isLoading, isError } = useEstimates();
  // local-only mutable state, re-seeded when the fetched data changes
  // (initialEstimates is `[]` on the first render while SWR is still loading).
  const [estimates, setEstimates] =
    useState<EstimateRecord[]>(initialEstimates);
  const [seededFrom, setSeededFrom] = useState(initialEstimates);
  if (seededFrom !== initialEstimates) {
    setSeededFrom(initialEstimates);
    setEstimates(initialEstimates);
  }

  const updateRecord = useCallback(
    (id: string, key: string, value: string) => {
      setEstimates((prev) =>
        prev.map((r) =>
          r.estimateNumber === id
            ? ({ ...r, [key]: value } as EstimateRecord)
            : r,
        ),
      );
    },
    [],
  );

  const processedData = useMemo(() => {
    let result = estimates;

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
      locked={locked}
      identifierKey="estimateNumber"
      onCellEdit={updateRecord}
    />
  );
}
