import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { MobileFAB } from "@/components/layout/mobile-fab";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { ProgressBar } from "@/components/layout/progress-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen">
      <ProgressBar />
      <OfflineBanner />
      <div className="flex min-h-screen flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
        </div>
        <BottomNav />
        <MobileFAB />
      </div>
    </div>
  );
}
