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
  Eye,
  PencilSimple,
  Lock,
} from "@phosphor-icons/react";
import {
  toggleShareNoteAction,
  updateSharePermissionAction,
} from "@/features/notes/actions/toggle-share.action";
import { toast } from "sonner";

interface NoteShareDialogProps {
  noteId: string;
  noteTitle?: string;
  initialIsShared: boolean;
  initialSlug: string | null;
  initialIsEditable?: boolean;
  isLocked?: boolean;
}

export function NoteShareDialog({
  noteId,
  noteTitle,
  initialIsShared,
  initialSlug,
  initialIsEditable = false,
  isLocked = false,
}: NoteShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [slug, setSlug] = useState(initialSlug);
  const [isEditable, setIsEditable] = useState(initialIsEditable);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPermissionPending, startPermissionTransition] = useTransition();

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = slug ? `${origin}/notes/public/${slug}` : "";

  const handleToggle = () => {
    startTransition(async () => {
      const nextState = !isShared;
      const res = await toggleShareNoteAction(noteId, nextState, isEditable);
      if (res.success) {
        setIsShared(res.data.isShared);
        setSlug(res.data.publicSlug);
        setIsEditable(res.data.isEditable);
        toast.success(
          res.data.isShared
            ? "Tautan publik berhasil diaktifkan!"
            : "Tautan publik dinonaktifkan."
        );
      } else {
        toast.error(res.error ?? "Gagal mengubah status bagikan.");
      }
    });
  };

  const handlePermissionChange = (editable: boolean) => {
    if (isEditable === editable || isPermissionPending) return;

    startPermissionTransition(async () => {
      setIsEditable(editable);
      const res = await updateSharePermissionAction(noteId, editable);
      if (res.success) {
        setIsEditable(res.data.isEditable);
        toast.success(
          res.data.isEditable
            ? "Izin diperbarui: Pengunjung dapat mengedit catatan."
            : "Izin diperbarui: Pengunjung hanya dapat membaca."
        );
      } else {
        setIsEditable(!editable);
        toast.error(res.error ?? "Gagal memperbarui izin catatan.");
      }
    });
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Tautan berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: noteTitle ? `${noteTitle} — Denycode Task Manager` : "Denycode Task Manager",
          text: noteTitle ? `Catatan: ${noteTitle}` : "Lihat catatan publik ini di Denycode",
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
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform ${
          isShared
            ? isEditable
              ? "bg-emerald-300 hover:bg-emerald-200"
              : "bg-purple-300 hover:bg-purple-200"
            : "bg-white hover:bg-neutral-100"
        }`}
        title="Bagikan Catatan"
      >
        <ShareNetwork size={14} weight="bold" />
        <span className="hidden sm:inline">
          {isShared
            ? isEditable
              ? "Dibagikan (Edit)"
              : "Dibagikan (Baca)"
            : "Bagikan"}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
                  <Globe size={18} weight="bold" />
                </span>
                <div>
                  <h3 className="font-black text-base text-black">Bagikan Catatan</h3>
                  {noteTitle && (
                    <p className="text-[11px] font-bold text-neutral-600 truncate max-w-[260px]">
                      {noteTitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 border border-black cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Aktifkan tautan publik agar catatan ini dapat diakses oleh siapa saja yang memiliki link. Anda dapat menentukan apakah pengunjung hanya bisa membaca atau dapat mengedit isi catatan.
            </p>

            {/* Toggle Status Aktif/Nonaktif */}
            <div className="flex items-center justify-between p-3 border-2 border-black bg-neutral-50">
              <div>
                <p className="font-bold text-xs text-black">Akses Tautan Publik</p>
                <p className="text-[11px] text-muted-foreground">
                  {isShared
                    ? "Tautan aktif dan dapat diakses publik"
                    : "Hanya Anda yang dapat melihat catatan ini"}
                </p>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                disabled={isPending}
                onClick={handleToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform disabled:opacity-50 min-w-[90px] justify-center cursor-pointer ${
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

            {/* Opsi Izin Akses (Hanya muncul jika share aktif) */}
            {isShared && (
              <div className="space-y-2 border-2 border-black p-3 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-black">
                    Izin Akses Pengunjung:
                  </label>
                  {isPermissionPending && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600">
                      <CircleNotch size={11} weight="bold" className="animate-spin" />
                      Menyimpan...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Pilihan: Hanya Baca */}
                  <button
                    type="button"
                    onClick={() => handlePermissionChange(false)}
                    disabled={isPermissionPending}
                    className={`flex flex-col text-left p-2.5 border-2 border-black transition-all cursor-pointer ${
                      !isEditable
                        ? "bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-white hover:bg-neutral-100 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-black text-xs text-black">
                        <Eye size={14} weight="bold" />
                        Hanya Baca
                      </span>
                      {!isEditable && (
                        <span className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-700 leading-tight">
                      Pengunjung hanya dapat membaca dan menyalin catatan.
                    </span>
                  </button>

                  {/* Pilihan: Bisa Diedit */}
                  <button
                    type="button"
                    onClick={() => handlePermissionChange(true)}
                    disabled={isPermissionPending}
                    className={`flex flex-col text-left p-2.5 border-2 border-black transition-all cursor-pointer ${
                      isEditable
                        ? "bg-emerald-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-white hover:bg-neutral-100 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-black text-xs text-black">
                        <PencilSimple size={14} weight="bold" />
                        Bisa Diedit
                      </span>
                      {isEditable && (
                        <span className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-700 leading-tight">
                      Pengunjung dengan tautan dapat mengedit isi catatan.
                    </span>
                  </button>
                </div>

                {/* Notifikasi info jika catatan terkunci */}
                {isLocked && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-100 border border-black/30 text-[11px] text-neutral-800 mt-2">
                    <Lock size={14} weight="fill" className="shrink-0 text-neutral-800 mt-0.5" />
                    <span>
                      Catatan ini dilindungi kata sandi. Pengunjung tetap wajib memasukkan kata sandi catatan sebelum dapat melihat atau mengedit.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tautan Publik & Berbagi */}
            {isShared && shareUrl && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-black">Tautan Publik:</label>
                  <div className="flex items-center gap-2">
                    <input
                      suppressHydrationWarning
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-black bg-neutral-100 select-all"
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

                {canNativeShare && (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-black bg-purple-300 hover:bg-purple-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer"
                  >
                    <PaperPlaneRight size={15} weight="bold" />
                    <span>Bagikan ke Aplikasi Lain (WhatsApp, Telegram, dll)</span>
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
                className="px-4 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 border-2 border-black cursor-pointer"
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
