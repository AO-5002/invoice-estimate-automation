import { Bell, User } from "lucide-react";

export default function DashboardNav() {
  return (
    <nav className="flex items-center justify-end gap-[22px] py-[13px]">
      <button className="text-white hover:text-white/80 transition-colors">
        <Bell className="size-[15px]" />
      </button>
      <button className="text-white hover:text-white/80 transition-colors">
        <User className="size-[15px]" />
      </button>
    </nav>
  );
}
