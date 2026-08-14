"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash, Paperclip, UploadSimple, Image as ImageIcon, FileText, DownloadSimple, X } from "@phosphor-icons/react";
import { updateCardAction, deleteCardAction } from "@/features/kanban/actions/card.action";
import {
  getCardAttachmentsAction,
  addCardAttachmentAction,
  deleteCardAttachmentAction,
} from "@/features/kanban/actions/attachment.action";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { toast } from "sonner";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { MAX_FILE_SIZE_BYTES } from "@/config/app";
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

export function CardDetailDialog({ card, open, onClose, onUpdated, onDeleted }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [deadline, setDeadline] = useState(card.deadline ? new Date(card.deadline).toISOString().slice(0, 16) : "");
  const [attachments, setAttachments] = useState<KanbanCardAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  // Load attachments when dialog opens
  useEffect(() => {
    if (open) {
      getCardAttachmentsAction(card.id).then((res) => {
        if (res.success) {
          setAttachments(res.data);
        }
      });
    }
  }, [open, card.id]);

  const handleSave = async () => {
    if (!title.trim()) return;

    // Ask confirmation before saving edits
    const ok = await confirm({
      title: "Simpan Perubahan Kartu",
      message: `Simpan perubahan pada kartu "${card.title}"?`,
      confirmLabel: "Simpan",
      danger: false,
    });
    if (!ok) return;

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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "/denycode/kanban");

      const uploadRes = await fetch("/api/upload/imagekit", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal mengunggah file ke ImageKit.");
      }

      const uploaded = await uploadRes.json();
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
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah lampiran.");
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-lg bg-white p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b-2 border-black pb-3">
          <DialogTitle className="font-black text-lg text-black">Detail Kartu Kanban</DialogTitle>
        </DialogHeader>

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
                  className="p-1.5 text-xs font-bold text-neutral-500 hover:text-red-600 border border-black hover:bg-red-50"
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
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-transform ${
                    isUploading
                      ? "bg-neutral-200 opacity-60 pointer-events-none"
                      : "bg-yellow-400 hover:bg-yellow-300 hover:-translate-y-0.5"
                  }`}
                >
                  <UploadSimple size={14} weight="bold" />
                  <span>{isUploading ? "Mengunggah..." : "+ Unggah"}</span>
                </label>
              </div>
            </div>

            {attachments.length > 0 ? (
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {attachments.map((att) => {
                  const isImage = att.fileType?.startsWith("image/");
                  return (
                    <li
                      key={att.id}
                      className="flex items-center justify-between p-2 border-2 border-black bg-neutral-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isImage ? (
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-8 h-8 object-cover border border-black shrink-0"
                          />
                        ) : (
                          <span className="p-1.5 bg-neutral-200 border border-black text-neutral-700 shrink-0">
                            <FileText size={16} weight="bold" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-black truncate max-w-[200px]" title={att.fileName}>
                            {att.fileName}
                          </p>
                          <p className="text-[10px] text-neutral-500">{formatBytes(att.fileSize)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-neutral-700 hover:text-black hover:bg-neutral-200 border border-transparent hover:border-black rounded transition-colors"
                          title="Buka / Unduh"
                        >
                          <DownloadSimple size={14} weight="bold" />
                        </a>
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={() => handleDeleteAttachment(att)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border-2 border-red-600 transition-colors"
            >
              <Trash size={14} weight="bold" />
              <span>Hapus Kartu</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200"
              >
                Batal
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleSave}
                disabled={isPending || !title.trim()}
                className="px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isPending ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
