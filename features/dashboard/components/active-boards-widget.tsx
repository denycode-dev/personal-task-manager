import Link from "next/link";
import {
  Kanban,
  ArrowRight,
  Plus,
  Columns,
} from "@phosphor-icons/react/dist/ssr";
import type { ActiveBoardSummary } from "@/features/dashboard/types";

interface ActiveBoardsWidgetProps {
  boards: ActiveBoardSummary[];
}

export function ActiveBoardsWidget({ boards }: ActiveBoardsWidgetProps) {
  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            <Kanban size={20} weight="bold" />
          </div>
          <div>
            <h2 className="text-lg font-black text-black leading-tight">
              Papan Kanban Aktif
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Progres alur kerja & tugas tim
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/kanban"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-sky-400 hover:bg-sky-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Papan Baru</span>
          </Link>
          <Link
            href="/kanban"
            className="p-1 text-xs font-bold text-black hover:underline inline-flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-black/30 bg-sky-50/50 text-center space-y-3">
          <div className="inline-flex p-3 bg-sky-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <Columns size={28} weight="bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-black">Belum Ada Papan Kanban</h3>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto">
              Buat papan kanban untuk mengelola alur kerja dengan drag-and-drop.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/kanban"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-400 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Papan Kanban</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/kanban/${board.id}`}
              className="group flex flex-col justify-between p-4 border-2 border-black bg-neutral-50 hover:bg-sky-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  {board.folder ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                        style={{ backgroundColor: board.folder.color }}
                      />
                      <span className="truncate max-w-[100px]">{board.folder.name}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Papan Utama
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[11px] font-black bg-black text-white border border-black">
                    {board.cardsCount} Kartu
                  </span>
                </div>

                <h3 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                  {board.title || "Papan tanpa judul"}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-black/10">
                <div className="flex flex-wrap gap-1.5">
                  {board.columns.map((col) => (
                    <span
                      key={col.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold border border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <span>{col.name}</span>
                      <span className="px-1 bg-neutral-100 text-[10px] font-black rounded-none border-l border-neutral-300">
                        {col.cardCount}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
