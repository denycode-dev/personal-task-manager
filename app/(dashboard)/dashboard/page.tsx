export const dynamic = "force-dynamic";

import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardMetrics } from "@/features/dashboard/components/dashboard-metrics";
import { DashboardNavigationHub } from "@/features/dashboard/components/dashboard-navigation-hub";
import { DashboardSummaryReport } from "@/features/dashboard/components/dashboard-summary-report";

export default async function DashboardPage() {
  const data = await dashboardService.getOverviewData();

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* 1. Minimalist Header & Status Sapaan */}
      <DashboardHeader
        greeting={data.greeting}
        formattedDate={data.formattedDate}
        urgentCount={data.stats.urgentDeadlinesCount}
      />

      {/* 2. Ringkasan Metrik Garis Besar (Executive Metric Cards) */}
      <DashboardMetrics stats={data.stats} />

      {/* 3. Pusat Navigasi Modul Utama (Navigation Hub) */}
      <DashboardNavigationHub stats={data.stats} />

      {/* 4. Laporan Garis Besar & Deadline Mendesak */}
      <DashboardSummaryReport
        upcomingDeadlines={data.upcomingDeadlines}
        recentNotes={data.recentNotes}
        activeBoards={data.activeBoards}
        recentChecklists={data.recentChecklists}
      />
    </div>
  );
}
