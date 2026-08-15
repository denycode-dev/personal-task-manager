export const dynamic = "force-dynamic";
import { folderService } from "@/features/folders/services/folder.service";
import { FolderList } from "@/features/folders/components/folder-list";

export default async function FoldersPage() {
  const folders = await folderService.getFoldersWithCounts();
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-black">Folder</h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Kelola kategori untuk mengelompokkan Catatan, Papan Kanban, dan Checklist
        </p>
      </div>
      <FolderList initialFolders={folders} />
    </div>
  );
}
