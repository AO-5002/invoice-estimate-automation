import RevenueChart from "../../components/RevenueChart";
import ActionsBar from "../../components/ActionsBar";

export default function TransactionRecordPage() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-[13px] py-[29px]">
        <RevenueChart title="Transactions" />
        <ActionsBar />
      </div>
    </>
  );
}
