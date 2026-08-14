"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBoardAction } from "@/features/kanban/actions/board.action";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";

export function CreateBoardForm() {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createBoardAction({ title: title.trim() });
      if (result.success) {
        toast.success("Board dibuat.");
        router.push(`/kanban/${result.data.id}`);
      } else toast.error(result.error);
    });
  };

  return (
    <div className="flex gap-2 mb-6">
      <input suppressHydrationWarning value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Nama board baru..."
        className="flex-1 border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        disabled={isPending} />
      <button suppressHydrationWarning onClick={submit} disabled={isPending || !title.trim()}
        className="px-4 py-2 bg-yellow-400 border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center gap-1">
        <Plus size={16} weight="bold" /> Buat Board
      </button>
    </div>
  );
}
