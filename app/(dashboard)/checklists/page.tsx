export const dynamic = "force-dynamic";

import { checklistRepository } from "@/features/checklists/repositories/checklist.repository";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { ChecklistsExplorer } from "@/features/checklists/components/checklists-explorer";

export default async function ChecklistsPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { folderId } = await searchParams;
  const [checklists, folders] = await Promise.all([
    checklistRepository.findAll(),
    folderRepository.findAll(),
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <ChecklistsExplorer
        initialChecklists={checklists}
        folders={folders}
        initialFolderId={folderId}
      />
    </div>
  );
}
