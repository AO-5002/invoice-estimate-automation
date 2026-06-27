import RevenueChart from "../../components/RevenueChart";
import QuotesInvoicesView from "../../components/QuotesInvoicesView";

export default function QuotesInvoicesPage() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-[13px] py-[29px]">
        <RevenueChart />
        <QuotesInvoicesView />
      </div>
    </>
  );
}
