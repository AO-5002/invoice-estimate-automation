import RevenueChart from "../../components/RevenueChart";
import ActionsBar from "../../components/ActionsBar";
import AgentViewPanel from "../../components/AgentViewPanel";

export default function QuotesInvoicesPage() {
  return (
    <>
      <h1 className="text-[34px] leading-[41px] tracking-[0.4px] text-white">
        Quotes & Invoices
      </h1>
      <div className="flex flex-1 flex-col gap-[13px] py-[29px]">
        <RevenueChart />
        <ActionsBar label="Agent View" />
        <div className="flex flex-1 min-h-[300px]">
          <AgentViewPanel />
        </div>
      </div>
    </>
  );
}
