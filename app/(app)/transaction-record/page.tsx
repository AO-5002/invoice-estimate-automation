import RevenueChart from "../../components/RevenueChart";
import ActionsBar from "../../components/ActionsBar";

export default function TransactionRecordPage() {
  return (
    <>
      <h1 className="text-[34px] leading-[41px] tracking-[0.4px] text-white">
        Transaction Record
      </h1>
      <div className="flex flex-1 flex-col gap-[13px] py-[29px]">
        <RevenueChart title="Transactions" />
        <ActionsBar />
      </div>
    </>
  );
}
