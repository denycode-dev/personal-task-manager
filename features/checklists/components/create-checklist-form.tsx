"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChecklistAction } from "@/features/checklists/actions/checklist.action";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";
import type { Folder as FolderType } from "@/lib/db/schema";

type Props = {
  folders?: FolderType[];
  defaultFolderId?: string;
};

export function CreateChecklistForm({ folders = [], defaultFolderId = "" }: Props) {
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createChecklistAction(title.trim(), folderId || undefined);
      if (result.success) {
        toast.success("Checklist berhasil dibuat.");
        router.push(`/checklists/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        suppressHydrationWarning
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Nama checklist baru..."
        className="flex-1 border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:bg-yellow-50"
        disabled={isPending}
      />

      {folders.length > 0 && (
        <select
          suppressHydrationWarning
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          disabled={isPending}
          className="border-2 border-black px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:bg-yellow-50 font-bold max-w-full sm:max-w-[200px]"
          title="Pilih folder untuk checklist ini"
        >
          <option value="">— Tanpa Folder —</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              📁 {f.name}
            </option>
          ))}
        </select>
      )}

      <button
        suppressHydrationWarning
        onClick={submit}
        disabled={isPending || !title.trim()}
        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
      >
        <Plus size={16} weight="bold" />
        <span>Buat Checklist</span>
      </button>
    </div>
  );
}
