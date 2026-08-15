"use client";

import { useTransition } from "react";
import { Trash, CircleNotch } from "@phosphor-icons/react";
import { useConfirm } from "@/lib/hooks/use-confirm";

type Props = {
  action: () => Promise<unknown>;
  confirmMessage?: string;
  confirmTitle?: string;
  className?: string;
};

export function DeleteConfirmButton({
  action,
  confirmMessage = "Hapus item ini?",
  confirmTitle = "Hapus",
  className,
}: Props) {
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    const ok = await confirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await action();
    });
  };

  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        className ??
        "p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center"
      }
      title={isPending ? "Sedang menghapus..." : confirmTitle}
    >
      {isPending ? (
        <CircleNotch size={16} weight="bold" className="animate-spin text-red-600" />
      ) : (
        <Trash size={16} weight="bold" />
      )}
    </button>
  );
}
