"use client";

import { useTransition } from "react";
import { Trash, CircleNotch } from "@phosphor-icons/react";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { toast } from "sonner";

type Props = {
  action: () => Promise<unknown>;
  confirmMessage?: string;
  confirmTitle?: string;
  successMessage?: string;
  className?: string;
  iconSize?: number;
};

export function DeleteConfirmButton({
  action,
  confirmMessage = "Hapus item ini?",
  confirmTitle = "Hapus",
  successMessage,
  className,
  iconSize = 16,
}: Props) {
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await action();
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (err: any) {
        if (err?.message !== "NEXT_REDIRECT") {
          toast.error("Gagal menghapus item.");
        }
      }
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
        "p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
      }
      title={isPending ? "Sedang menghapus..." : confirmTitle}
    >
      {isPending ? (
        <CircleNotch size={iconSize} weight="bold" className="animate-spin text-red-600" />
      ) : (
        <Trash size={iconSize} weight="bold" />
      )}
    </button>
  );
}
