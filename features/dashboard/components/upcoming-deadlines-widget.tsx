import Link from "next/link";
import {
  ClockCountdown,
  Kanban,
  CheckSquare,
  ArrowRight,
  Sparkle,
  CheckCircle,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import type { UpcomingDeadline } from "@/features/deadlines/types";

interface UpcomingDeadlinesWidgetProps {
  deadlines: UpcomingDeadline[];
}

export function UpcomingDeadlinesWidget({ deadlines }: UpcomingDeadlinesWidgetProps) {
  return (
    <section
      id="upcoming-deadlines"
      className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            <ClockCountdown size={20} weight="bold" />
          </div>
          <div>
            <h2 className="text-lg font-black text-black leading-tight">
              Akan Jatuh Tempo
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Deadline H-1 & Tugas Terlambat
            </p>
          </div>
        </div>

        {deadlines.length > 0 ? (
          <span className="px-2.5 py-1 text-xs font-black bg-rose-100 text-rose-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {deadlines.length} Tugas
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-black bg-emerald-100 text-emerald-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Terkendali
          </span>
        )}
      </div>

      {deadlines.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-black/30 bg-emerald-50/50 text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <CheckCircle size={28} weight="fill" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-black">Semua Tugas Aman! 🎉</h3>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              Tidak ada kartu kanban atau checklist yang mendesak dalam 48 jam ke depan.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <CalendarBlank size={14} weight="bold" />
              <span>Buka Kalender Lengkap</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deadlines.map((item) => {
            const isOverdue = item.status === "overdue";
            const isToday = item.status === "today";
            const isTomorrow = item.status === "tomorrow";

            const statusBadgeConfig = isOverdue
              ? { label: "Terlambat", bg: "bg-red-500 text-white", border: "border-black" }
              : isToday
                ? { label: "Hari ini", bg: "bg-orange-400 text-black", border: "border-black" }
                : { label: "Besok", bg: "bg-yellow-300 text-black", border: "border-black" };

            const targetHref = item.source === "kanban" ? "/kanban" : "/checklists";

            return (
              <Link
                key={`${item.source}-${item.id}`}
                href={targetHref}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-2 border-black bg-neutral-50 hover:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-[11px] font-black uppercase border-2 ${statusBadgeConfig.border} ${statusBadgeConfig.bg} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0`}
                  >
                    {statusBadgeConfig.label}
                  </span>

                  <div className="min-w-0">
                    <p className="font-bold text-sm text-black truncate group-hover:underline decoration-2">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium capitalize">
                        {item.source === "kanban" ? (
                          <Kanban size={13} weight="bold" className="text-sky-600" />
                        ) : (
                          <CheckSquare size={13} weight="bold" className="text-emerald-600" />
                        )}
                        {item.source}
                      </span>
                      <span>•</span>
                      <span>
                        {new Intl.DateTimeFormat("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        }).format(new Date(item.deadline))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-1 transition-transform">
                    <span>Lihat</span>
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
