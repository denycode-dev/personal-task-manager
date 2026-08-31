export const dynamic = "force-dynamic";

import { boardService } from "@/features/kanban/services/board.service";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { KanbanExplorer } from "@/features/kanban/components/kanban-explorer";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { folderId } = await searchParams;
  const [boards, folders] = await Promise.all([
    boardService.getAll(),
    folderRepository.findAll(),
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <KanbanExplorer
        initialBoards={boards}
        folders={folders}
        initialFolderId={folderId}
      />
    </div>
  );
}
