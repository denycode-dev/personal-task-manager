"use client";

import { useState, useTransition } from "react";
import {
  ShareNetwork,
  Copy,
  Check,
  Globe,
  X,
  CircleNotch,
  PaperPlaneRight,
  Folder,
  Lock,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { toggleShareFolderAction } from "@/features/folders/actions/toggle-folder-share.action";
import { toast } from "sonner";
import Link from "next/link";

interface FolderShareDialogProps {
  folderId: string;
  folderName: string;
  folderColor?: string;
  initialIsShared: boolean;
  initialSlug: string | null;
  triggerButton?: React.ReactNode;
  notesCount?: number;
}

export function FolderShareDialog({
  folderId,
  folderName,
  folderColor = "#FFD500",
  initialIsShared,
  initialSlug,
  triggerButton,
  notesCount,
}: FolderShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [slug, setSlug] = useState(initialSlug);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = slug ? `${origin}/folders/public/${slug}` : "";

  const handleToggle = () => {
    startTransition(async () => {
      const nextState = !isShared;
      const res = await toggleShareFolderAction(folderId, nextState);
      if (res.success) {
        setIsShared(res.data.isShared);
        setSlug(res.data.publicSlug);
        toast.success(
          res.data.isShared
            ? `Tautan publik untuk folder "${folderName}" berhasil diaktifkan!`
            : `Tautan publik folder "${folderName}" telah dinonaktifkan.`
        );
      } else {
        toast.error(res.error ?? "Gagal mengubah status berbagi folder.");
      }
    });
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Tautan folder berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Folder Catatan: ${folderName}`,
          text: `Lihat kumpulan catatan dalam folder "${folderName}" di Denycode Task Manager`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {triggerButton}
        </div>
      ) : (
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer ${
            isShared
              ? "bg-purple-300 hover:bg-purple-200 text-black"
              : "bg-white hover:bg-neutral-100 text-black"
          }`}
          title="Bagikan Seluruh Catatan dalam Folder"
        >
          <ShareNetwork size={14} weight="bold" />
          <span>{isShared ? "Folder Publik (Aktif)" : "Bagikan Folder"}</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="p-1.5 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: folderColor }}
                >
                  <Folder size={18} weight="fill" className="text-black" />
                </span>
                <div>
                  <h3 className="font-black text-base text-black">Bagikan Folder</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-neutral-700 truncate max-w-[220px]">
                      {folderName}
                    </span>
                    {typeof notesCount === "number" && (
                      <span className="px-1.5 py-0.2 text-[10px] font-black bg-neutral-200 border border-black">
                        {notesCount} catatan
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 border border-black cursor-pointer"
                title="Tutup dialog"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Explanation */}
            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              Aktifkan tautan publik agar semua catatan di dalam folder <strong>{folderName}</strong> dapat diakses secara publik dalam satu katalog oleh siapa saja yang memiliki link.
            </p>

            {/* Toggle Status Aktif/Nonaktif */}
            <div className="flex items-center justify-between p-3 border-2 border-black bg-neutral-50">
              <div>
                <p className="font-black text-xs text-black">Status Akses Folder</p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {isShared
                    ? "Folder aktif & dapat diakses publik via tautan"
                    : "Hanya Anda yang dapat mengakses folder ini"}
                </p>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                disabled={isPending}
                onClick={handleToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform disabled:opacity-50 min-w-[95px] justify-center cursor-pointer ${
                  isShared
                    ? "bg-emerald-400 text-black hover:bg-emerald-300"
                    : "bg-neutral-200 text-black hover:bg-neutral-300"
                }`}
              >
                {isPending ? (
                  <>
                    <CircleNotch size={13} weight="bold" className="animate-spin" />
                    <span>Proses...</span>
                  </>
                ) : isShared ? (
                  "Aktif"
                ) : (
                  "Nonaktif"
                )}
              </button>
            </div>

            {/* Jika folder aktif dibagikan */}
            {isShared && shareUrl && (
              <div className="space-y-3 pt-1">
                {/* Input Tautan Publik */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-black flex items-center justify-between">
                    <span>Tautan Publik Folder:</span>
                    <Link
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-purple-700 hover:underline font-bold"
                    >
                      <span>Buka Tautan</span>
                      <ArrowSquareOut size={12} weight="bold" />
                    </Link>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      suppressHydrationWarning
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-black bg-neutral-100 select-all text-black"
                    />
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      title="Salin Tautan"
                    >
                      {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                      <span>{copied ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>

                {/* Notifikasi Proteksi PIN */}
                <div className="flex items-start gap-2 p-2.5 bg-yellow-50 border-2 border-black text-[11px] text-neutral-800">
                  <Lock size={15} weight="fill" className="shrink-0 text-amber-700 mt-0.5" />
                  <span className="leading-snug font-medium">
                    Catatan ber-PIN di dalam folder ini tetap terlindungi dan memerlukan kata sandi untuk dibuka oleh pengunjung.
                  </span>
                </div>

                {/* Tombol Native Share / WhatsApp */}
                {canNativeShare && (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-black bg-purple-300 hover:bg-purple-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer text-black"
                  >
                    <PaperPlaneRight size={15} weight="bold" />
                    <span>Bagikan ke WhatsApp & Aplikasi Lain</span>
                  </button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 border-2 border-black cursor-pointer text-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
