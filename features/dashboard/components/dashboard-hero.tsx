import { Sparkle, CalendarBlank, WarningCircle, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface DashboardHeroProps {
  greeting: string;
  formattedDate: string;
  urgentCount: number;
}

export function DashboardHero({ greeting, formattedDate, urgentCount }: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden border-2 border-black bg-gradient-to-r from-yellow-300 via-yellow-200 to-amber-200 p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Decorative Neobrutalism Pattern Elements */}
      <div className="absolute top-2 right-3 md:top-4 md:right-6 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <Sparkle size={14} weight="fill" className="text-yellow-400" />
          Denycode Workspace
        </span>
      </div>

      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CalendarBlank size={16} weight="bold" />
          <span>{formattedDate}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-black">
          {greeting}, <span className="underline decoration-black decoration-4 underline-offset-4">Deny!</span> ⚡
        </h1>

        <p className="text-sm sm:text-base font-medium text-black/80 max-w-2xl leading-relaxed">
          Catat ide penting, kelola tugas kanban, dan selesaikan checklist harianmu dalam satu dashboard terpusat tanpa hambatan.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          {urgentCount > 0 ? (
            <Link
              href="#upcoming-deadlines"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <WarningCircle size={18} weight="fill" className="animate-pulse" />
              <span>{urgentCount} tugas mendesak jatuh tempo</span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-400 text-black font-bold text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle size={18} weight="fill" />
              <span>Semua deadline terkendali dengan baik</span>
            </div>
          )}

          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-black font-bold text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
          >
            <CalendarBlank size={16} weight="bold" />
            <span>Lihat Linimasa Kalender</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
