"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import CreateRecordModal from "./CreateRecordModal";

export default function AgentViewPanel() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex flex-1 items-center justify-center rounded-[13px] border-[1.5px] border-[#313131] bg-[#232323] p-[10px] transition-colors hover:border-[#7987FF]/50 cursor-pointer w-full"
      >
        <div className="flex flex-col items-center gap-[13px]">
          <Bot className="size-6 text-white" />
          <p className="text-[15px] leading-[20px] tracking-[-0.23px] text-[#989898]">
            Create a new Invoice / Estimate
          </p>
        </div>
      </button>
      <CreateRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
