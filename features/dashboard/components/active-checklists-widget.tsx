import Link from "next/link";
import {
  ListChecks,
  CheckCircle,
  Circle,
  ArrowRight,
  Plus,
  CheckSquare,
} from "@phosphor-icons/react/dist/ssr";
import type { ChecklistSummary } from "@/features/dashboard/types";

interface ActiveChecklistsWidgetProps {
  checklists: ChecklistSummary[];
}

export function ActiveChecklistsWidget({ checklists }: ActiveChecklistsWidgetProps) {
  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            <ListChecks size={20} weight="bold" />
          </div>
          <div>
            <h2 className="text-lg font-black text-black leading-tight">
              Checklist & Target Aktif
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Progres penyelesaian daftar tugas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/checklists"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Checklist Baru</span>
          </Link>
          <Link
            href="/checklists"
            className="p-1 text-xs font-bold text-black hover:underline inline-flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      {checklists.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-black/30 bg-emerald-50/50 text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <CheckSquare size={28} weight="bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-black">Belum Ada Checklist</h3>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto">
              Buat checklist belanja, target harian, atau daftar pekerjaan yang perlu dicentang.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/checklists"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Checklist Baru</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checklists.map((cl) => (
            <Link
              key={cl.id}
              href={`/checklists/${cl.id}`}
              className="group flex flex-col justify-between p-4 border-2 border-black bg-neutral-50 hover:bg-emerald-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  {cl.folder ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                        style={{ backgroundColor: cl.folder.color }}
                      />
                      <span className="truncate max-w-[100px]">{cl.folder.name}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Checklist Mandiri
                    </span>
                  )}
                  <span className="text-xs font-black text-black">
                    {cl.completedItems}/{cl.totalItems} Selesai
                  </span>
                </div>

                <h3 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                  {cl.title || "Checklist tanpa judul"}
                </h3>

                {/* Neobrutalist Progress Bar */}
                <div className="mt-3 w-full h-3 border-2 border-black bg-neutral-200 overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <div
                    className="h-full bg-emerald-400 border-r-2 border-black transition-all"
                    style={{ width: `${cl.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t-2 border-black/10 space-y-1">
                {cl.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Belum ada item tugas.</p>
                ) : (
                  cl.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      {item.isDone ? (
                        <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      ) : (
                        <Circle size={14} weight="bold" className="text-neutral-400 shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          item.isDone ? "line-through text-neutral-400 font-medium" : "text-black font-semibold"
                        }`}
                      >
                        {item.content}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
