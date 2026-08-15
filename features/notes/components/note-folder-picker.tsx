"use client";

import { useState, useTransition } from "react";
import { updateNoteAction } from "@/features/notes/actions/update-note.action";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { toast } from "sonner";
import { Folder as FolderIcon, CircleNotch } from "@phosphor-icons/react";
import type { Folder } from "@/lib/db/schema";

type Props = {
  noteId: string;
  currentFolderId: string | null;
  folders: Folder[];
};

export function NoteFolderPicker({ noteId, currentFolderId, folders }: Props) {
  const [folderId, setFolderId] = useState(currentFolderId ?? "");
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const handleChange = async (newId: string) => {
    const targetFolder = folders.find((f) => f.id === newId);
    const targetName = targetFolder ? targetFolder.name : "Tanpa folder";

    const ok = await confirm({
      title: "Pindahkan Catatan",
      message: `Pindahkan catatan ini ke "${targetName}"?`,
      confirmLabel: "Pindahkan",
      danger: false,
    });
    if (!ok) return;

    setFolderId(newId);
    startTransition(async () => {
      const result = await updateNoteAction(noteId, { folderId: newId || null });
      if (result.success) {
        toast.success(`Catatan dipindahkan ke "${targetName}".`);
      } else {
        toast.error("Gagal memperbarui folder.");
      }
    });
  };

  if (folders.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {isPending ? (
        <CircleNotch size={14} weight="bold" className="animate-spin text-neutral-800 shrink-0" />
      ) : (
        <FolderIcon size={14} weight="fill" className="text-neutral-600 shrink-0" />
      )}
      <select
        suppressHydrationWarning
        value={folderId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="text-xs border-2 border-black px-2 py-1 bg-white focus:outline-none focus:bg-yellow-50 disabled:opacity-50 font-bold"
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
