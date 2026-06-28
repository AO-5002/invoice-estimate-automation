"use client";

import { useState, useCallback } from "react";
import ActionsBar, { type SortSpec } from "./ActionsBar";
import AgentViewPanel from "./AgentViewPanel";
import InvoiceView, {
  INVOICE_COLUMNS,
  INVOICE_SORT_FIELDS,
} from "./InvoiceView";
import EstimateView, {
  ESTIMATE_COLUMNS,
  ESTIMATE_SORT_FIELDS,
} from "./EstimateView";
import CreateRecordModal from "./CreateRecordModal";

type View = "agent" | "invoice" | "estimate";

const DEFAULT_INVOICE_SORT: SortSpec = { key: "invoiceDate", direction: "desc" };
const DEFAULT_ESTIMATE_SORT: SortSpec = {
  key: "estimateDate",
  direction: "desc",
};

export default function QuotesInvoicesView() {
  const [view, setView] = useState<View>("agent");
  const [modalOpen, setModalOpen] = useState(false);
  const [locked, setLocked] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenInvoiceCols, setHiddenInvoiceCols] = useState<Set<string>>(
    new Set(),
  );
  const [hiddenEstimateCols, setHiddenEstimateCols] = useState<Set<string>>(
    new Set(),
  );
  const [invoiceSort, setInvoiceSort] =
    useState<SortSpec>(DEFAULT_INVOICE_SORT);
  const [estimateSort, setEstimateSort] =
    useState<SortSpec>(DEFAULT_ESTIMATE_SORT);

  const handleViewChange = useCallback((v: View) => {
    setView(v);
    setSearchQuery("");
  }, []);

  const toggleInvoiceCol = useCallback((key: string) => {
    setHiddenInvoiceCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleEstimateCol = useCallback((key: string) => {
    setHiddenEstimateCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isInvoice = view === "invoice";
  const isEstimate = view === "estimate";
  const isTable = isInvoice || isEstimate;

  return (
    <>
      <ActionsBar
        view={view}
        onViewChange={handleViewChange}
        onCreate={() => setModalOpen(true)}
        {...(isTable
          ? {
              searchQuery,
              onSearchChange: setSearchQuery,
              columns: (isInvoice ? INVOICE_COLUMNS : ESTIMATE_COLUMNS).map(
                (c) => ({ key: c.key, label: c.label }),
              ),
              hiddenColumns: isInvoice
                ? hiddenInvoiceCols
                : hiddenEstimateCols,
              onToggleColumn: isInvoice ? toggleInvoiceCol : toggleEstimateCol,
              sortFields: isInvoice
                ? INVOICE_SORT_FIELDS
                : ESTIMATE_SORT_FIELDS,
              sortSpec: isInvoice ? invoiceSort : estimateSort,
              onSortChange: isInvoice ? setInvoiceSort : setEstimateSort,
              locked,
              onToggleLock: () => setLocked((v) => !v),
            }
          : {})}
      />
      <div className="flex flex-1 min-h-[300px]">
        {view === "agent" && (
          <AgentViewPanel onCreate={() => setModalOpen(true)} />
        )}
        {isInvoice && (
          <InvoiceView
            searchQuery={searchQuery}
            hiddenColumns={hiddenInvoiceCols}
            sortSpec={invoiceSort}
            locked={locked}
          />
        )}
        {isEstimate && (
          <EstimateView
            searchQuery={searchQuery}
            hiddenColumns={hiddenEstimateCols}
            sortSpec={estimateSort}
            locked={locked}
          />
        )}
      </div>
      <CreateRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSendWithAgent={() => setView("agent")}
      />
    </>
  );
}
