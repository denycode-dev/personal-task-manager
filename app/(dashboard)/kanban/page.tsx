export const dynamic = "force-dynamic";

import Link from "next/link";
import { boardService } from "@/features/kanban/services/board.service";
import { CreateBoardForm } from "@/features/kanban/components/create-board-form";
import { Kanban, Plus, Layout, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default async function KanbanPage() {
  const boards = await boardService.getAll();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black">Papan Kanban</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Kelola alur kerja tugas dengan drag-and-drop antar kolom
          </p>
        </div>
      </div>

      <CreateBoardForm />

      {boards.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-blue-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-blue-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <Layout size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">Belum ada papan kanban.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Buat papan kanban pertamamu di atas untuk mulai mengatur alur tugas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/kanban/${board.id}`}
              className="group flex flex-col justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-blue-900">
                    <Kanban size={18} weight="bold" />
                  </span>
                  <h2 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                    {board.title}
                  </h2>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>
                  {new Date(board.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1 text-black font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>Buka Papan</span>
                  <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
