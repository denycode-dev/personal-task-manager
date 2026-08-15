"use client";

import { useState, useTransition } from "react";
import { updateBoardFolderAction } from "@/features/kanban/actions/board.action";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { toast } from "sonner";
import { Folder } from "@phosphor-icons/react";
import type { Folder as FolderType } from "@/lib/db/schema";

type Props = {
  boardId: string;
  currentFolderId: string | null;
  folders: FolderType[];
};

export function BoardFolderPicker({ boardId, currentFolderId, folders }: Props) {
  const [folderId, setFolderId] = useState(currentFolderId ?? "");
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const handleChange = async (newId: string) => {
    const targetFolder = folders.find((f) => f.id === newId);
    const targetName = targetFolder ? targetFolder.name : "Tanpa folder";

    const ok = await confirm({
      title: "Pindahkan Papan Kanban",
      message: `Pindahkan papan ini ke "${targetName}"?`,
      confirmLabel: "Pindahkan",
      danger: false,
    });
    if (!ok) return;

    setFolderId(newId);
    startTransition(async () => {
      const result = await updateBoardFolderAction(boardId, newId || null);
      if (result.success) {
        toast.success(`Papan kanban dipindahkan ke "${targetName}".`);
      } else {
        toast.error("Gagal memperbarui folder board.");
      }
    });
  };

  if (folders.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Folder size={16} weight="fill" className="text-neutral-600 shrink-0" />
      <select
        suppressHydrationWarning
        value={folderId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="text-xs border-2 border-black px-2 py-1 bg-white focus:outline-none focus:bg-yellow-50 disabled:opacity-50 font-bold max-w-[150px] sm:max-w-[200px]"
        title="Pindah ke folder"
      >
        <option value="">Tanpa folder</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
