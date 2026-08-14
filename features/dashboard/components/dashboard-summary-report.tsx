import Link from "next/link";
import {
  ClockCountdown,
  Kanban,
  CheckSquare,
  ArrowRight,
  NotePencil,
  Article,
  CheckCircle,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import type {
  UpcomingDeadline,
  RecentNoteSummary,
  ActiveBoardSummary,
  ChecklistSummary,
} from "@/features/dashboard/types";

interface DashboardSummaryReportProps {
  upcomingDeadlines: UpcomingDeadline[];
  recentNotes: RecentNoteSummary[];
  activeBoards: ActiveBoardSummary[];
  recentChecklists: ChecklistSummary[];
}

export function DashboardSummaryReport({
  upcomingDeadlines,
  recentNotes,
  activeBoards,
  recentChecklists,
}: DashboardSummaryReportProps) {
  const topNotes = recentNotes.slice(0, 3);
  const topBoard = activeBoards[0];
  const topChecklist = recentChecklists[0];

  return (
    <section id="deadline-report" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-black uppercase tracking-tight text-black">
          <Article size={20} weight="bold" className="text-black" />
          Laporan Garis Besar (Executive Report)
        </h2>
        <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
          Status prioritas & ringkasan aktivitas
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Laporan Deadline Mendesak */}
        <div className="flex flex-col justify-between p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
                  <ClockCountdown size={18} weight="bold" />
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-black">
                  Prioritas Jatuh Tempo (H-1)
                </h3>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {upcomingDeadlines.length} Tugas
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="inline-flex p-2 bg-emerald-100 text-emerald-700 border-2 border-black rounded-full">
                  <CheckCircle size={24} weight="fill" />
                </div>
                <p className="text-xs font-bold text-black">
                  Tidak ada deadline mendesak dalam 48 jam ke depan.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Semua kartu Kanban dan checklist dalam kondisi aman.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.slice(0, 4).map((item) => {
                  const isOverdue = item.status === "overdue";
                  const isToday = item.status === "today";
                  const badgeColor = isOverdue
                    ? "bg-red-500 text-white"
                    : isToday
                      ? "bg-orange-400 text-black"
                      : "bg-yellow-300 text-black";
                  const label = isOverdue
                    ? "Terlambat"
                    : isToday
                      ? "Hari ini"
                      : "Besok";

                  const href = item.source === "kanban" ? "/kanban" : "/checklists";

                  return (
                    <Link
                      key={`${item.source}-${item.id}`}
                      href={href}
                      className="group flex items-center justify-between gap-2 p-2.5 border-2 border-black bg-neutral-50 hover:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${badgeColor} shrink-0`}
                        >
                          {label}
                        </span>
                        <span className="font-bold text-black truncate group-hover:underline">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0">
                        {item.source}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline"
            >
              <CalendarBlank size={14} weight="bold" />
              <span>Buka Linimasa Kalender</span>
            </Link>
            {upcomingDeadlines.length > 0 && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                Diurutkan berdasarkan urgensi
              </span>
            )}
          </div>
        </div>

        {/* 2. Ringkasan Aktivitas Terkini */}
        <div className="flex flex-col justify-between p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-yellow-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
                  <Article size={18} weight="bold" />
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-black">
                  Ringkasan Aktivitas Terbaru
                </h3>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                Snapshot
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Catatan Terakhir */}
              <div className="p-3 border-2 border-black bg-neutral-50 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-black">
                  <span className="flex items-center gap-1.5">
                    <NotePencil size={15} weight="bold" className="text-yellow-600" />
                    <span>Catatan Terbaru</span>
                  </span>
                  <Link href="/notes" className="text-[11px] text-muted-foreground hover:underline">
                    Lihat Semua &rarr;
                  </Link>
                </div>
                {topNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Belum ada catatan.</p>
                ) : (
                  <div className="space-y-1">
                    {topNotes.map((n) => (
                      <Link
                        key={n.id}
                        href={`/notes/${n.id}`}
                        className="flex items-center justify-between text-xs hover:underline decoration-1"
                      >
                        <span className="font-semibold text-black truncate max-w-[200px] sm:max-w-[260px]">
                          • {n.title || "Catatan tanpa judul"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(n.updatedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Kanban & Checklist Teratas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Kanban Snapshot */}
                <div className="p-2.5 border-2 border-black bg-sky-50 space-y-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-black">
                    <Kanban size={14} weight="bold" className="text-sky-700" />
                    <span>Board Aktif</span>
                  </div>
                  {topBoard ? (
                    <Link
                      href={`/kanban/${topBoard.id}`}
                      className="block text-xs font-semibold text-black truncate hover:underline"
                    >
                      {topBoard.title} ({topBoard.cardsCount} kartu)
                    </Link>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">Belum ada board.</p>
                  )}
                </div>

                {/* Checklist Snapshot */}
                <div className="p-2.5 border-2 border-black bg-emerald-50 space-y-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-black">
                    <CheckSquare size={14} weight="bold" className="text-emerald-700" />
                    <span>Checklist Aktif</span>
                  </div>
                  {topChecklist ? (
                    <Link
                      href={`/checklists/${topChecklist.id}`}
                      className="block text-xs font-semibold text-black truncate hover:underline"
                    >
                      {topChecklist.title} ({topChecklist.completedItems}/{topChecklist.totalItems})
                    </Link>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">Belum ada checklist.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between">
            <span className="text-xs font-bold text-black">
              Denycode Workspace
            </span>
            <Link
              href="/notes"
              className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline"
            >
              <span>Buka Dokumen</span>
              <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
