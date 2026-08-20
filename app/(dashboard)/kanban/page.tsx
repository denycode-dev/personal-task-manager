export const dynamic = "force-dynamic";

import Link from "next/link";
import { boardService } from "@/features/kanban/services/board.service";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { deleteBoardAction } from "@/features/kanban/actions/board.action";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { CreateBoardForm } from "@/features/kanban/components/create-board-form";
import { Kanban, Layout, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { folderId } = await searchParams;
  const [boards, folders] = await Promise.all([
    boardService.getAll(folderId || undefined),
    folderRepository.findAll(),
  ]);

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

      <CreateBoardForm folders={folders} defaultFolderId={folderId} />

      {/* Folder filter pills */}
      {folders.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href="/kanban"
            className={`px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform ${
              !folderId ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
            }`}
          >
            Semua
          </Link>
          {folders.map((f) => (
            <Link
              key={f.id}
              href={`/kanban?folderId=${f.id}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform ${
                folderId === f.id ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
              }`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                style={{ backgroundColor: f.color }}
              />
              <span>{f.name}</span>
            </Link>
          ))}
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-blue-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-blue-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <Layout size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">Belum ada papan kanban.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {folderId
              ? "Tidak ada papan kanban di folder ini. Buat papan baru di atas atau pilih folder lain."
              : "Buat papan kanban pertamamu di atas untuk mulai mengatur alur tugas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => {
            const folder = folders.find((f) => f.id === board.folderId);
            return (
              <div
                key={board.id}
                className="group relative flex flex-col justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/kanban/${board.id}`} className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="p-1.5 bg-blue-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-blue-900 shrink-0">
                        <Kanban size={18} weight="bold" />
                      </span>
                      <h2 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                        {board.title}
                      </h2>
                    </Link>

                    <DeleteConfirmButton
                      action={deleteBoardAction.bind(null, board.id)}
                      confirmTitle="Hapus Papan Kanban"
                      confirmMessage={`Hapus papan kanban "${board.title}"? Semua kolom dan kartu di dalamnya akan ikut terhapus.`}
                      successMessage="Papan kanban berhasil dihapus."
                      className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer shrink-0"
                      iconSize={14}
                    />
                  </div>

                  {folder ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 border border-black/20">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate max-w-[150px]">{folder.name}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Tanpa Folder
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>
                    {new Date(board.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/kanban/${board.id}`}
                    className="inline-flex items-center gap-1 text-black font-bold group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Buka Papan</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
