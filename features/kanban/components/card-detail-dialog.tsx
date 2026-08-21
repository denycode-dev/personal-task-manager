"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash, Paperclip, UploadSimple, FileText, DownloadSimple, X, CircleNotch, Eye } from "@phosphor-icons/react";
import { updateCardAction, deleteCardAction } from "@/features/kanban/actions/card.action";
import {
  getCardAttachmentsAction,
  addCardAttachmentAction,
  deleteCardAttachmentAction,
} from "@/features/kanban/actions/attachment.action";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { AttachmentPreviewModal } from "@/features/kanban/components/attachment-preview-modal";
import { toast } from "sonner";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { MAX_FILE_SIZE_BYTES } from "@/config/app";
import { uploadClientFile } from "@/lib/imagekit/client-upload";
import type { KanbanCard, KanbanCardAttachment } from "@/lib/db/schema";

type Props = {
  card: KanbanCard;
  open: boolean;
  onClose: () => void;
  onUpdated: (card: KanbanCard) => void;
  onDeleted: (id: string) => void;
};

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function CardDetailContent({
  card,
  onClose,
  onUpdated,
  onDeleted,
}: {
  card: KanbanCard;
  onClose: () => void;
  onUpdated: (card: KanbanCard) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [deadline, setDeadline] = useState(
    card.deadline ? new Date(card.deadline).toISOString().slice(0, 16) : ""
  );
  const [attachments, setAttachments] = useState<KanbanCardAttachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<KanbanCardAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  useEffect(() => {
    let active = true;
    getCardAttachmentsAction(card.id).then((res) => {
      if (active && res.success) {
        setAttachments(res.data);
      }
    });
    return () => {
      active = false;
    };
  }, [card.id]);

  const handleSave = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await updateCardAction(card.id, {
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
      });
      if (result.success) {
        toast.success("Kartu diperbarui.");
        onUpdated(result.data);
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Hapus kartu",
      message: `Hapus kartu "${card.title}"? Semua lampiran kartu juga akan terhapus.`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteCardAction(card.id);
      toast.success("Kartu dihapus.");
      onDeleted(card.id);
      onClose();
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Ukuran file melebihi batas maksimum 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadClientFile(file, {
        folder: "/denycode/kanban",
      });

      const saveRes = await addCardAttachmentAction(card.id, {
        fileUrl: uploaded.url,
        imagekitFileId: uploaded.fileId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      if (saveRes.success) {
        setAttachments((prev) => [saveRes.data, ...prev]);
        toast.success("Lampiran berhasil diunggah.");
      } else {
        toast.error(saveRes.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengunggah lampiran.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (att: KanbanCardAttachment) => {
    const ok = await confirm({
      title: "Hapus lampiran",
      message: `Hapus lampiran "${att.fileName}"?`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;

    const res = await deleteCardAttachmentAction(att.id, att.imagekitFileId);
    if (res.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      toast.success("Lampiran dihapus.");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Title input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-black">Judul Kartu *</label>
          <input
            suppressHydrationWarning
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul tugas kartu..."
            className="w-full border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-yellow-50"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-black">Deskripsi</label>
          <textarea
            suppressHydrationWarning
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tambahkan catatan atau detail tugas..."
            rows={3}
            className="w-full border-2 border-black p-2.5 text-xs focus:outline-none focus:bg-yellow-50 resize-none leading-relaxed"
          />
        </div>

        {/* Deadline */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-black">Tenggat Waktu (Deadline)</label>
          <div className="flex items-center gap-2">
            <input
              suppressHydrationWarning
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border-2 border-black px-2.5 py-1.5 text-xs focus:outline-none focus:bg-yellow-50 flex-1"
            />
            {deadline && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setDeadline("")}
                className="p-1.5 text-xs font-bold text-neutral-500 hover:text-red-600 border border-black hover:bg-red-50 cursor-pointer"
                title="Hapus deadline"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
          {deadline && (
            <div className="pt-1">
              <DeadlineBadge deadline={new Date(deadline)} />
            </div>
          )}
        </div>

        {/* Attachments Section (≤ 5MB) */}
        <div className="space-y-2 pt-2 border-t-2 border-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-black">
              <Paperclip size={16} weight="bold" />
              <span>Lampiran Berkas (Maks 5MB)</span>
              <span className="text-neutral-500 font-semibold">({attachments.length})</span>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="card-file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="card-file-upload"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-transform ${
                  isUploading
                    ? "bg-neutral-200 opacity-60 pointer-events-none"
                    : "bg-yellow-400 hover:bg-yellow-300 hover:-translate-y-0.5"
                }`}
              >
                {isUploading ? (
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                ) : (
                  <UploadSimple size={14} weight="bold" />
                )}
                <span>{isUploading ? "Mengunggah..." : "+ Unggah"}</span>
              </label>
            </div>
          </div>

          {attachments.length > 0 ? (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {attachments.map((att) => {
                const isImage =
                  att.fileType?.startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(att.fileName);
                const isPdf =
                  att.fileType === "application/pdf" || att.fileName.toLowerCase().endsWith(".pdf");
                const canPreview = isImage || isPdf;

                return (
                  <li
                    key={att.id}
                    className="flex items-center justify-between p-2 border-2 border-black bg-neutral-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-50/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        canPreview
                          ? setPreviewAttachment(att)
                          : window.open(att.fileUrl, "_blank")
                      }
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
                      title={
                        canPreview
                          ? "Klik untuk melihat pratinjau berkas"
                          : "Buka berkas"
                      }
                    >
                      {isImage ? (
                        <span className="w-9 h-9 border border-black shrink-0 bg-white group-hover:scale-105 transition-transform overflow-hidden inline-flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full h-full object-cover"
                          />
                        </span>
                      ) : (
                        <span className="p-2 bg-neutral-200 border border-black text-neutral-800 shrink-0 group-hover:bg-yellow-300 transition-colors">
                          {isPdf ? (
                            <FileText size={16} weight="bold" />
                          ) : (
                            <Paperclip size={16} weight="bold" />
                          )}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p
                          className="font-bold text-black truncate max-w-[180px] sm:max-w-[220px] group-hover:underline decoration-2"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                          <span>{formatBytes(att.fileSize)}</span>
                          {canPreview && (
                            <span className="text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 border border-emerald-400">
                              {isImage ? "Gambar" : "PDF"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {canPreview && (
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="p-1.5 text-black hover:bg-yellow-300 border border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 cursor-pointer"
                          title="Pratinjau langsung"
                        >
                          <Eye size={14} weight="bold" />
                        </button>
                      )}
                      <a
                        href={att.fileUrl}
                        download={att.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-neutral-700 hover:text-black hover:bg-neutral-200 border border-transparent hover:border-black rounded transition-colors"
                        title="Unduh berkas"
                      >
                        <DownloadSimple size={14} weight="bold" />
                      </a>
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => handleDeleteAttachment(att)}
                        className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors cursor-pointer"
                        title="Hapus lampiran"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[11px] text-neutral-500 italic">
              Belum ada lampiran pada kartu ini.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-3 border-t-2 border-black/10">
          <button
            suppressHydrationWarning
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border-2 border-red-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <CircleNotch size={14} weight="bold" className="animate-spin text-red-600" />
            ) : (
              <Trash size={14} weight="bold" />
            )}
            <span>{isPending ? "Menghapus..." : "Hapus Kartu"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              suppressHydrationWarning
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleSave}
              disabled={isPending || !title.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 min-w-[130px] justify-center cursor-pointer"
            >
              {isPending ? (
                <>
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                  <span>Menyimpan…</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Full Preview Modal (Images & PDFs) */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        open={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
}

export function CardDetailDialog({ card, open, onClose, onUpdated, onDeleted }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-lg bg-white p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b-2 border-black pb-3">
          <DialogTitle className="font-black text-lg text-black">Detail Kartu Kanban</DialogTitle>
        </DialogHeader>

        {open && (
          <CardDetailContent
            card={card}
            onClose={onClose}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
