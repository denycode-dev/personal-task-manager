"use client";
import { GlobalSearch } from "@/features/search/components/global-search";
import { logoutAction } from "@/features/auth/actions/logout.action";
import { SignOut, Bell } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function Topbar() {
  const [deadlineCount, setDeadlineCount] = useState(0);

  useEffect(() => {
    fetch("/api/deadlines/count")
      .then((r) => r.ok ? r.json() : { count: 0 })
      .then((d) => setDeadlineCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 h-14 border-b-2 border-black bg-white">
      <GlobalSearch />
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell size={20} className="text-muted-foreground" />
          {deadlineCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5 border border-white">
              {deadlineCount > 99 ? "99+" : deadlineCount}
            </span>
          )}
        </div>
        <form action={logoutAction}>
          <button suppressHydrationWarning type="submit" className="flex items-center gap-1 text-sm font-medium hover:text-red-600 transition-colors">
            <SignOut size={16} weight="bold" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}
