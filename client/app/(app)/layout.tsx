import DashboardNav from "../components/DashboardNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 bg-[#1e1e1e]">
      <div className="flex w-full max-w-[1048px] mx-auto flex-col gap-[22px] py-[13px]">
        <DashboardNav />
        {children}
      </div>
    </div>
  );
}
