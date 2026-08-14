import Link from "next/link";
import {
  NotePencil,
  Kanban,
  CheckSquare,
  ClockCountdown,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";
import type { DashboardStats } from "@/features/dashboard/types";

interface DashboardMetricsProps {
  stats: DashboardStats;
}

export function DashboardMetrics({ stats }: DashboardMetricsProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Catatan */}
      <Link
        href="/notes"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black bg-yellow-200/80 hover:bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-yellow-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
            <NotePencil size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70">
            Total Catatan
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black">
            {stats.totalNotes}
          </p>
          <p className="text-[11px] font-bold text-black/70 mt-0.5">
            Dokumen tersimpan
          </p>
        </div>
      </Link>

      {/* 2. Kanban */}
      <Link
        href="/kanban"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black bg-sky-200/80 hover:bg-sky-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-sky-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
            <Kanban size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70">
            Kartu Kanban
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black">
            {stats.totalCards}
          </p>
          <p className="text-[11px] font-bold text-black/70 mt-0.5">
            di {stats.totalBoards} papan alur
          </p>
        </div>
      </Link>

      {/* 3. Checklist */}
      <Link
        href="/checklists"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black bg-emerald-200/80 hover:bg-emerald-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-emerald-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
            <CheckSquare size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70">
            Progress Checklist
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black">
            {stats.checklistCompletionRate}%
          </p>
          <p className="text-[11px] font-bold text-black/70 mt-0.5">
            {stats.checklistDone}/{stats.checklistTotal} item selesai
          </p>
        </div>
      </Link>

      {/* 4. Jatuh Tempo */}
      <Link
        href="#deadline-report"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black bg-rose-200/80 hover:bg-rose-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-rose-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
            <ClockCountdown size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70">
            Deadline H-1
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black">
            {stats.urgentDeadlinesCount}
          </p>
          <p className="text-[11px] font-bold text-black/70 mt-0.5">
            {stats.overdueCount > 0
              ? `${stats.overdueCount} telat • ${stats.todayCount} hari ini`
              : `${stats.todayCount} hari ini • ${stats.tomorrowCount} besok`}
          </p>
        </div>
      </Link>
    </section>
  );
}
