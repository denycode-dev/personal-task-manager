"use client";

import { useConfirmStore } from "@/lib/stores/confirm.store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Warning, Trash, CheckCircle } from "@phosphor-icons/react";

export function ConfirmDialog() {
  const { open, title, message, confirmLabel, danger, answer } = useConfirmStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && answer(false)}>
      <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-3 animate-in fade-in zoom-in-95">
        <DialogHeader className="border-b-2 border-black pb-2.5">
          <DialogTitle className="flex items-center gap-2 font-black text-base text-black">
            {danger ? (
              <span className="p-1 bg-red-100 border border-black text-red-600">
                <Warning size={18} weight="fill" />
              </span>
            ) : (
              <span className="p-1 bg-yellow-100 border border-black text-yellow-800">
                <CheckCircle size={18} weight="fill" />
              </span>
            )}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-neutral-700 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex justify-end items-center gap-2 pt-2 border-t-2 border-black/10">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => answer(false)}
            className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            Batal
          </button>
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => answer(true)}
            className={`px-4 py-1.5 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${
              danger
                ? "bg-red-500 hover:bg-red-400 text-white"
                : "bg-yellow-400 hover:bg-yellow-300 text-black"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
