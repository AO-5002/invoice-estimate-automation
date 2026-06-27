"use client";

import { useState } from "react";
import ActionsBar from "./ActionsBar";
import AgentViewPanel from "./AgentViewPanel";
import InvoiceView from "./InvoiceView";
import EstimateView from "./EstimateView";
import CreateRecordModal from "./CreateRecordModal";

type View = "agent" | "invoice" | "estimate";

export default function QuotesInvoicesView() {
  const [view, setView] = useState<View>("agent");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ActionsBar
        view={view}
        onViewChange={setView}
        onCreate={() => setModalOpen(true)}
      />
      <div className="flex flex-1 min-h-[300px]">
        {view === "agent" && (
          <AgentViewPanel onCreate={() => setModalOpen(true)} />
        )}
        {view === "invoice" && <InvoiceView />}
        {view === "estimate" && <EstimateView />}
      </div>
      <CreateRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSendWithAgent={() => setView("agent")}
      />
    </>
  );
}
