"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { mutate } from "swr";
import { useEstimates, type EstimateRecord } from "../hooks/useEstimates";
import RecordTable, { type Column } from "./RecordTable";
import type { SortSpec, SortField } from "./ActionsBar";
import { compareDates, formatCurrency, parseCurrencyAmount } from "../lib/format";
import { patchJSON } from "../lib/fetcher";

export const ESTIMATE_COLUMNS: Column<EstimateRecord>[] = [
  { key: "id", label: "ID" },
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

  const [editError, setEditError] = useState<string | null>(null);
  useEffect(() => {
    if (!editError) return;
    const t = setTimeout(() => setEditError(null), 3000);
    return () => clearTimeout(t);
  }, [editError]);

  const updateRecord = useCallback((id: string, key: string, value: string) => {
    // Optimistically apply the edit locally...
    setEstimates((prev) =>
      prev.map((r) =>
        r.id === id ? ({ ...r, [key]: value } as EstimateRecord) : r,
      ),
    );
    // ...then persist that single cell. Revalidate on success; on failure
    // revalidate too (restoring the server's truth) and surface the error.
    patchJSON(`/api/estimates/${id}`, { key, value })
      .then(() => mutate("/api/estimates"))
      .catch(() => {
        setEditError("Failed to save change. Reverting.");
        mutate("/api/estimates");
      });
  }, []);

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
    <>
      <RecordTable<EstimateRecord>
        columns={visibleColumns}
        data={processedData}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No estimates yet"
        errorMessage="Failed to load estimates. Please try again later."
        locked={locked}
        identifierKey="id"
        onCellEdit={updateRecord}
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
