export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { checklistService } from "@/features/checklists/services/checklist.service";
import { checklistItemRepository } from "@/features/checklists/repositories/checklist-item.repository";
import { ChecklistItemRow } from "@/features/checklists/components/checklist-item";
import { AddItemForm } from "@/features/checklists/components/add-item-form";
import { deleteChecklistAction } from "@/features/checklists/actions/checklist.action";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { ChecklistFolderPicker } from "@/features/checklists/components/checklist-folder-picker";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { ArrowLeft, CheckCircle, ListChecks } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let checklist;
  try {
    checklist = await checklistService.getById(id);
  } catch {
    notFound();
  }
  const [items, folders] = await Promise.all([
    checklistItemRepository.findByChecklistId(id),
    folderRepository.findAll(),
  ]);
  const doneCount = items.filter((i) => i.isDone).length;
  const percentage = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/checklists"
            className="text-muted-foreground text-sm hover:text-black flex items-center gap-1 shrink-0 font-medium"
          >
            <ArrowLeft size={16} weight="bold" />
            <span className="hidden sm:inline">Checklist</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl sm:text-2xl font-black text-black truncate max-w-[200px] sm:max-w-[350px]">
            {checklist.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ChecklistFolderPicker
            checklistId={checklist.id}
            currentFolderId={checklist.folderId}
            folders={folders}
          />

          <DeleteConfirmButton
            action={deleteChecklistAction.bind(null, id, "/checklists")}
            confirmTitle="Hapus Checklist"
            confirmMessage={`Hapus checklist "${checklist.title}"? Semua item di dalamnya akan terhapus.`}
          />
        </div>
      </div>

      {/* Progress Bar Card */}
      {items.length > 0 && (
        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-neutral-800">
              <CheckCircle size={16} weight="fill" className="text-emerald-500" />
              <span>{doneCount} dari {items.length} tugas selesai</span>
            </span>
            <span className="px-2 py-0.5 bg-yellow-400 border border-black font-black">
              {percentage}%
            </span>
          </div>
          <div className="h-3 bg-neutral-100 border-2 border-black overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        <ul className="space-y-2">
          {items.map((item) => (
            <ChecklistItemRow key={item.id} item={item} checklistId={id} />
          ))}
        </ul>

        {items.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-black/30 bg-emerald-50/50 space-y-2">
            <ListChecks size={28} className="mx-auto text-muted-foreground" />
            <p className="text-sm font-bold text-black">Belum ada item checklist.</p>
            <p className="text-xs text-muted-foreground">Tambahkan item tugas pertama di bawah ini.</p>
          </div>
        )}

        <AddItemForm checklistId={id} />
      </div>
    </div>
  );
}
