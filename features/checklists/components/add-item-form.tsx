"use client";
import { useState, useTransition } from "react";
import { addChecklistItemAction } from "@/features/checklists/actions/checklist.action";
import { toast } from "sonner";
import { Plus, CaretDown, CaretUp, CircleNotch } from "@phosphor-icons/react";

export function AddItemForm({ checklistId }: { checklistId: string }) {
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showDeadline, setShowDeadline] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addChecklistItemAction(checklistId, content.trim(), deadline || undefined);
      if (result.success) { setContent(""); setDeadline(""); toast.success("Item ditambahkan."); }
      else toast.error(result.error);
    });
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <input suppressHydrationWarning value={content} onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isPending && submit()}
          placeholder="Tambah item baru... (Enter)"
          className="flex-1 border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
          disabled={isPending} />
        <button suppressHydrationWarning onClick={() => setShowDeadline((v) => !v)} title="Set deadline"
          className="px-3 py-2 border-2 border-black hover:bg-gray-100 transition-colors">
          {showDeadline ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </button>
        <button suppressHydrationWarning onClick={submit} disabled={isPending || !content.trim()}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 inline-flex items-center justify-center min-w-[48px]">
          {isPending ? (
            <CircleNotch size={16} weight="bold" className="animate-spin" />
          ) : (
            <Plus size={16} weight="bold" />
          )}
        </button>
      </div>
      {showDeadline && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Deadline:</label>
          <input suppressHydrationWarning type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className="border-2 border-black px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400" />
          {deadline && <button suppressHydrationWarning onClick={() => setDeadline("")} className="text-xs text-muted-foreground hover:text-red-600">Hapus</button>}
        </div>
      )}
    </div>
  );
}
