"use client";

import { useTransition } from "react";
import { Trash, CircleNotch } from "@phosphor-icons/react";
import { toggleChecklistItemAction, deleteChecklistItemAction } from "@/features/checklists/actions/checklist.action";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { toast } from "sonner";
import { useConfirm } from "@/lib/hooks/use-confirm";
import type { ChecklistItem } from "@/lib/db/schema";

export function ChecklistItemRow({
  item,
  checklistId,
}: {
  item: ChecklistItem;
  checklistId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleChecklistItemAction(item.id, !item.isDone, checklistId);
      if (!result.success) toast.error("Gagal memperbarui item.");
    });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Hapus Item Checklist",
      message: `Hapus item "${item.content}"?`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      await deleteChecklistItemAction(item.id, checklistId);
      toast.success("Item berhasil dihapus.");
    });
  };

  return (
    <li
      className={`flex items-center gap-3 p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <input
        suppressHydrationWarning
        type="checkbox"
        checked={item.isDone}
        onChange={handleToggle}
        disabled={isPending}
        className="w-5 h-5 border-2 border-black cursor-pointer accent-yellow-400 disabled:cursor-not-allowed"
      />
      <span
        className={`flex-1 text-xs sm:text-sm font-medium ${
          item.isDone ? "line-through text-muted-foreground" : "text-black"
        }`}
      >
        {item.content}
      </span>
      {item.deadline && !item.isDone && <DeadlineBadge deadline={item.deadline} />}
      <button
        suppressHydrationWarning
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors shrink-0 disabled:opacity-50"
        title="Hapus item"
      >
        {isPending ? (
          <CircleNotch size={15} weight="bold" className="animate-spin text-red-600" />
        ) : (
          <Trash size={15} weight="bold" />
        )}
      </button>
    </li>
  );
}
