export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { boardRepository } from "@/features/kanban/repositories/board.repository";
import { columnRepository } from "@/features/kanban/repositories/column.repository";
import { cardRepository } from "@/features/kanban/repositories/card.repository";
import { deleteBoardAction } from "@/features/kanban/actions/board.action";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { BoardFolderPicker } from "@/features/kanban/components/board-folder-picker";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { KanbanBoard } from "@/features/kanban/components/kanban-board";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default async function KanbanBoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const [board, folders] = await Promise.all([
    boardRepository.findById(boardId),
    folderRepository.findAll(),
  ]);
  if (!board) notFound();

  const columns = await columnRepository.findByBoardId(boardId);
  const columnsWithCards = await Promise.all(
    columns.map(async (col) => ({
      ...col,
      cards: await cardRepository.findByColumnId(col.id),
    }))
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b-2 border-black bg-white flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/kanban"
            className="text-muted-foreground text-sm hover:text-black flex items-center gap-1 shrink-0 font-medium"
          >
            <ArrowLeft size={16} weight="bold" />
            <span className="hidden sm:inline">Kanban</span>
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <h1 className="font-black text-base sm:text-lg text-black truncate max-w-[180px] sm:max-w-[350px]">
            {board.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <BoardFolderPicker
            boardId={board.id}
            currentFolderId={board.folderId}
            folders={folders}
          />

          <DeleteConfirmButton
            action={deleteBoardAction.bind(null, boardId, "/kanban")}
            confirmTitle="Hapus Papan Kanban"
            confirmMessage={`Hapus papan kanban "${board.title}"? Semua kolom dan kartu di dalamnya akan ikut terhapus.`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <KanbanBoard board={board} initialColumns={columnsWithCards} />
      </div>
    </div>
  );
}
