"use client";

import { useState, useTransition } from "react";
import { ShareNetwork, Copy, Check, Globe, X, CircleNotch } from "@phosphor-icons/react";
import { toggleShareNoteAction } from "@/features/notes/actions/toggle-share.action";
import { toast } from "sonner";

interface NoteShareDialogProps {
  noteId: string;
  initialIsShared: boolean;
  initialSlug: string | null;
}

export function NoteShareDialog({
  noteId,
  initialIsShared,
  initialSlug,
}: NoteShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [slug, setSlug] = useState(initialSlug);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = slug ? `${origin}/notes/public/${slug}` : "";

  const handleToggle = () => {
    startTransition(async () => {
      const nextState = !isShared;
      const res = await toggleShareNoteAction(noteId, nextState);
      if (res.success) {
        setIsShared(res.data.isShared);
        setSlug(res.data.publicSlug);
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

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Tautan berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform ${
          isShared ? "bg-purple-300 hover:bg-purple-200" : "bg-white hover:bg-neutral-100"
        }`}
        title="Bagikan Catatan"
      >
        <ShareNetwork size={14} weight="bold" />
        <span className="hidden sm:inline">{isShared ? "Dibagikan" : "Bagikan"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
                  <Globe size={18} weight="bold" />
                </span>
                <h3 className="font-black text-base text-black">Bagikan Catatan</h3>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 border border-black"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Aktifkan tautan publik agar catatan ini dapat dibaca oleh siapa saja tanpa perlu login.
            </p>

            <div className="flex items-center justify-between p-3 border-2 border-black bg-neutral-50">
              <div>
                <p className="font-bold text-xs text-black">Akses Publik (Read-Only)</p>
                <p className="text-[11px] text-muted-foreground">
                  {isShared ? "Siapapun yang punya link bisa membaca" : "Hanya Anda yang dapat melihat"}
                </p>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                disabled={isPending}
                onClick={handleToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform disabled:opacity-50 min-w-[90px] justify-center ${
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

            {isShared && shareUrl && (
              <div className="space-y-2">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                    <span>{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 border-2 border-black"
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
