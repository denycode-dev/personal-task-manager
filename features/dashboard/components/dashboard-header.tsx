import {
  CalendarBlank,
  Sparkle,
  WarningCircle,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

interface DashboardHeaderProps {
  greeting: string;
  formattedDate: string;
  urgentCount: number;
}

export function DashboardHeader({
  greeting,
  formattedDate,
  urgentCount,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-yellow-400 text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Sparkle size={12} weight="fill" />
            Denycode Task Manager
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
          {greeting}, <span className="underline decoration-yellow-400 decoration-4 underline-offset-2">Deny</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
          Pusat navigasi dan laporan ringkas produktivitas harian Anda.
        </p>
      </div>

      <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CalendarBlank size={15} weight="bold" />
          <span>{formattedDate}</span>
        </div>

        {urgentCount > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <WarningCircle size={15} weight="fill" className="text-rose-600" />
            <span>{urgentCount} tugas mendesak (H-1)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle size={15} weight="fill" className="text-emerald-600" />
            <span>Semua target terkendali</span>
          </div>
        )}
      </div>
    </header>
  );
}
