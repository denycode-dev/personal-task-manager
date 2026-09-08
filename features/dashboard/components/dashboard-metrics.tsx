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
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black dark:border-yellow-400/80 dark:hover:border-yellow-400 bg-yellow-200/80 hover:bg-yellow-300 dark:bg-card shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,204,21,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-yellow-300 border-2 border-black dark:border-yellow-400/40 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] dark:shadow-[1px_1px_0px_0px_rgba(250,204,21,0.5)]">
            <NotePencil size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black dark:text-yellow-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70 dark:text-yellow-400">
            Total Catatan
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black dark:text-foreground">
            {stats.totalNotes}
          </p>
          <p className="text-[11px] font-bold text-black/70 dark:text-zinc-400 mt-0.5">
            Dokumen tersimpan
          </p>
        </div>
      </Link>

      {/* 2. Kanban */}
      <Link
        href="/kanban"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black dark:border-sky-400/80 dark:hover:border-sky-400 bg-sky-200/80 hover:bg-sky-300 dark:bg-card shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(56,189,248,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-sky-300 border-2 border-black dark:border-sky-400/40 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] dark:shadow-[1px_1px_0px_0px_rgba(56,189,248,0.5)]">
            <Kanban size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black dark:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70 dark:text-sky-400">
            Kartu Kanban
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black dark:text-foreground">
            {stats.totalCards}
          </p>
          <p className="text-[11px] font-bold text-black/70 dark:text-zinc-400 mt-0.5">
            di {stats.totalBoards} papan alur
          </p>
        </div>
      </Link>

      {/* 3. Checklist */}
      <Link
        href="/checklists"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black dark:border-emerald-400/80 dark:hover:border-emerald-400 bg-emerald-200/80 hover:bg-emerald-300 dark:bg-card shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(52,211,153,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-emerald-300 border-2 border-black dark:border-emerald-400/40 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] dark:shadow-[1px_1px_0px_0px_rgba(52,211,153,0.5)]">
            <CheckSquare size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70 dark:text-emerald-400">
            Progress Checklist
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black dark:text-foreground">
            {stats.checklistCompletionRate}%
          </p>
          <p className="text-[11px] font-bold text-black/70 dark:text-zinc-400 mt-0.5">
            {stats.checklistDone}/{stats.checklistTotal} item selesai
          </p>
        </div>
      </Link>

      {/* 4. Jatuh Tempo */}
      <Link
        href="#deadline-report"
        className="group flex flex-col justify-between p-4 sm:p-5 border-2 border-black dark:border-rose-400/80 dark:hover:border-rose-400 bg-rose-200/80 hover:bg-rose-300 dark:bg-card shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(251,113,133,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="p-2 bg-black text-rose-300 border-2 border-black dark:border-rose-400/40 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] dark:shadow-[1px_1px_0px_0px_rgba(251,113,133,0.5)]">
            <ClockCountdown size={20} weight="fill" />
          </span>
          <ArrowUpRight
            size={18}
            weight="bold"
            className="text-black dark:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70 dark:text-rose-400">
            Deadline H-1
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black dark:text-foreground">
            {stats.urgentDeadlinesCount}
          </p>
          <p className="text-[11px] font-bold text-black/70 dark:text-zinc-400 mt-0.5">
            {stats.overdueCount > 0
              ? `${stats.overdueCount} telat • ${stats.todayCount} hari ini`
              : `${stats.todayCount} hari ini • ${stats.tomorrowCount} besok`}
          </p>
        </div>
      </Link>
    </section>
  );
}
