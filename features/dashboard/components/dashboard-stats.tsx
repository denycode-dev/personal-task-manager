import Link from "next/link";
import {
  NotePencil,
  Kanban,
  CheckSquare,
  ClockCountdown,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";
import type { DashboardStats as IDashboardStats } from "@/features/dashboard/types";

interface DashboardStatsProps {
  stats: IDashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Notes Card */}
      <Link
        href="/notes"
        className="group relative flex flex-col justify-between p-5 border-2 border-black dark:border-yellow-400/80 dark:hover:border-yellow-400 bg-yellow-300 dark:bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="p-2.5 bg-black text-yellow-300 border-2 border-black dark:border-yellow-400/40 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,204,21,0.5)]">
            <NotePencil size={24} weight="fill" />
          </div>
          <span className="p-1 text-black dark:text-yellow-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <ArrowUpRight size={20} weight="bold" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-black/80 dark:text-yellow-400">
            Total Catatan
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-foreground">{stats.totalNotes}</span>
            <span className="text-xs font-semibold text-black/70 dark:text-zinc-400">tersimpan</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t-2 border-black/20 dark:border-border text-[11px] font-bold text-black/80 dark:text-yellow-400">
          Kelola rich text & dokumen &rarr;
        </div>
      </Link>

      {/* 2. Kanban Boards Card */}
      <Link
        href="/kanban"
        className="group relative flex flex-col justify-between p-5 border-2 border-black dark:border-sky-400/80 dark:hover:border-sky-400 bg-sky-300 dark:bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(56,189,248,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="p-2.5 bg-black text-sky-300 border-2 border-black dark:border-sky-400/40 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:shadow-[2px_2px_0px_0px_rgba(56,189,248,0.5)]">
            <Kanban size={24} weight="fill" />
          </div>
          <span className="p-1 text-black dark:text-sky-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <ArrowUpRight size={20} weight="bold" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-black/80 dark:text-sky-400">
            Papan Kanban
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-foreground">{stats.totalBoards}</span>
            <span className="text-xs font-semibold text-black/70 dark:text-zinc-400">
              board ({stats.totalCards} kartu)
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t-2 border-black/20 dark:border-border text-[11px] font-bold text-black/80 dark:text-sky-400">
          Atur tahapan & drag-and-drop &rarr;
        </div>
      </Link>

      {/* 3. Checklist Card */}
      <Link
        href="/checklists"
        className="group relative flex flex-col justify-between p-5 border-2 border-black dark:border-emerald-400/80 dark:hover:border-emerald-400 bg-emerald-300 dark:bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(52,211,153,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="p-2.5 bg-black text-emerald-300 border-2 border-black dark:border-emerald-400/40 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:shadow-[2px_2px_0px_0px_rgba(52,211,153,0.5)]">
            <CheckSquare size={24} weight="fill" />
          </div>
          <span className="p-1 text-black dark:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <ArrowUpRight size={20} weight="bold" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-black/80 dark:text-emerald-400">
            Checklist Harian
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-foreground">
              {stats.checklistDone}
              <span className="text-xl font-bold text-black/60 dark:text-zinc-400">/{stats.checklistTotal}</span>
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 bg-black text-white rounded-none">
              {stats.checklistCompletionRate}%
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t-2 border-black/20 dark:border-border text-[11px] font-bold text-black/80 dark:text-emerald-400">
          {stats.checklistPending} item belum selesai &rarr;
        </div>
      </Link>

      {/* 4. Urgent Deadlines Card */}
      <Link
        href="#upcoming-deadlines"
        className="group relative flex flex-col justify-between p-5 border-2 border-black dark:border-rose-400/80 dark:hover:border-rose-400 bg-rose-300 dark:bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(251,113,133,0.25)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="p-2.5 bg-black text-rose-300 border-2 border-black dark:border-rose-400/40 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:shadow-[2px_2px_0px_0px_rgba(251,113,133,0.5)]">
            <ClockCountdown size={24} weight="fill" />
          </div>
          <span className="p-1 text-black dark:text-rose-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <ArrowUpRight size={20} weight="bold" />
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-black/80 dark:text-rose-400">
            Jatuh Tempo (H-1)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-foreground">
              {stats.urgentDeadlinesCount}
            </span>
            <span className="text-xs font-semibold text-black/70 dark:text-zinc-400">
              {stats.overdueCount > 0 ? `(${stats.overdueCount} telat)` : "mendesak"}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t-2 border-black/20 dark:border-border text-[11px] font-bold text-black/80 dark:text-rose-400">
          {stats.todayCount} hari ini • {stats.tomorrowCount} besok &rarr;
        </div>
      </Link>
    </section>
  );
}
