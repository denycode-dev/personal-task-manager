export const dynamic = "force-dynamic";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { FolderList } from "@/features/folders/components/folder-list";

export default async function FoldersPage() {
  const folders = await folderRepository.findAll();
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Folder</h1>
      <FolderList initialFolders={folders} />
    </div>
  );
}
