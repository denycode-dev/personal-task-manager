"use client";

import { useState, useTransition, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  X,
  CircleNotch,
  Clock,
  Kanban,
  Paperclip,
  UploadSimple,
  FileText,
  Trash,
  Eye,
} from "@phosphor-icons/react";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { AttachmentPreviewModal } from "@/features/kanban/components/attachment-preview-modal";
import { createCardAction } from "@/features/kanban/actions/card.action";
import { addCardAttachmentAction } from "@/features/kanban/actions/attachment.action";
import { MAX_FILE_SIZE_BYTES } from "@/config/app";
import { uploadClientFile } from "@/lib/imagekit/client-upload";
import { toast } from "sonner";
import type { KanbanCard, KanbanColumn, KanbanCardAttachment } from "@/lib/db/schema";

type Column = KanbanColumn & { cards: KanbanCard[] };

type TempAttachment = {
  id: string;
  fileUrl: string;
  imagekitFileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  columns: Column[];
  defaultColumnId?: string;
  onCardCreated: (newCard: KanbanCard, targetColumnId: string) => void;
};

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function CreateCardForm({
  onClose,
  columns,
  defaultColumnId,
  onCardCreated,
}: {
  onClose: () => void;
  columns: Column[];
  defaultColumnId?: string;
  onCardCreated: (newCard: KanbanCard, targetColumnId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId || (columns[0]?.id ?? ""));
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [attachments, setAttachments] = useState<TempAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<KanbanCardAttachment | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setPresetDeadline = (type: "today" | "tomorrow" | "3days" | "1week") => {
    const now = new Date();
    if (type === "today") {
      now.setHours(17, 0, 0, 0);
    } else if (type === "tomorrow") {
      now.setDate(now.getDate() + 1);
      now.setHours(12, 0, 0, 0);
    } else if (type === "3days") {
      now.setDate(now.getDate() + 3);
      now.setHours(17, 0, 0, 0);
    } else if (type === "1week") {
      now.setDate(now.getDate() + 7);
      now.setHours(17, 0, 0, 0);
    }

    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setDeadline(localISOTime);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" terlalu besar (maksimal 5MB).`);
        continue;
      }

      try {
        const uploaded = await uploadClientFile(file, {
          folder: "/denycode/kanban",
        });

        const newAtt: TempAttachment = {
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileUrl: uploaded.url,
          imagekitFileId: uploaded.fileId,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        };

        setAttachments((prev) => [...prev, newAtt]);
        successCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Gagal mengunggah file.";
        toast.error(`Gagal mengunggah "${file.name}": ${message}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (successCount > 0) {
      toast.success(`${successCount} file berhasil diunggah.`);
    }
  };

  const handleRemoveTempAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul kartu wajib diisi.");
      return;
    }
    if (!columnId) {
      toast.error("Pilih kolom tujuan.");
      return;
    }

    const targetColumn = columns.find((c) => c.id === columnId) || columns[0];
    const position = targetColumn ? targetColumn.cards.length : 0;

    startTransition(async () => {
      const result = await createCardAction({
        columnId,
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        position,
      });

      if (result.success) {
        const createdCard = result.data;

        // If there are uploaded attachments, save them linked to this card
        if (attachments.length > 0) {
          try {
            await Promise.all(
              attachments.map((att) =>
                addCardAttachmentAction(createdCard.id, {
                  fileUrl: att.fileUrl,
                  imagekitFileId: att.imagekitFileId,
                  fileName: att.fileName,
                  fileType: att.fileType,
                  fileSize: att.fileSize,
                })
              )
            );
          } catch (attErr) {
            console.error("Failed to link some attachments:", attErr);
          }
        }

        const msg = attachments.length > 0
          ? `Kartu berhasil dibuat dengan ${attachments.length} lampiran di "${targetColumn?.name || "Kolom"}".`
          : `Kartu berhasil ditambahkan ke "${targetColumn?.name || "Kolom"}".`;

        toast.success(msg);
        onCardCreated(createdCard, columnId);
        onClose();
      } else {
        toast.error(result.error || "Gagal membuat kartu kanban.");
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Title input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-black">
            Judul Kartu / Tugas <span className="text-red-600">*</span>
          </label>
          <input
            suppressHydrationWarning
            autoFocus
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Implementasi modul autentikasi..."
            className="w-full border-2 border-black px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:bg-yellow-50 disabled:opacity-60"
            disabled={isPending}
          />
        </div>

        {/* Column Target Select */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-black">
            Kolom Target <span className="text-red-600">*</span>
          </label>
          <select
            suppressHydrationWarning
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
            disabled={isPending}
            className="w-full border-2 border-black px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:bg-yellow-50 disabled:opacity-60 cursor-pointer"
          >
            {columns.map((col, idx) => (
              <option key={col.id} value={col.id}>
                {col.name} {idx === 0 ? "(Kolom Utama / Masuk)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Description textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-black">
            Deskripsi & Catatan Detail
          </label>
          <textarea
            suppressHydrationWarning
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tambahkan rincian tugas, acceptance criteria, atau catatan penting..."
            className="w-full border-2 border-black p-2.5 text-xs bg-white focus:outline-none focus:bg-yellow-50 resize-none leading-relaxed disabled:opacity-60"
            disabled={isPending}
          />
        </div>

        {/* Deadline with Quick Presets */}
        <div className="space-y-1.5 pt-1 border-t-2 border-black/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-black flex items-center gap-1.5">
              <Clock size={14} weight="bold" />
              <span>Tenggat Waktu (Deadline)</span>
            </label>
            {deadline && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setDeadline("")}
                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <X size={12} weight="bold" />
                <span>Hapus Deadline</span>
              </button>
            )}
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setPresetDeadline("today")}
              className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
            >
              Hari Ini (17:00)
            </button>
            <button
              type="button"
              onClick={() => setPresetDeadline("tomorrow")}
              className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
            >
              Besok (12:00)
            </button>
            <button
              type="button"
              onClick={() => setPresetDeadline("3days")}
              className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
            >
              +3 Hari
            </button>
            <button
              type="button"
              onClick={() => setPresetDeadline("1week")}
              className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
            >
              +1 Minggu
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              suppressHydrationWarning
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border-2 border-black px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:bg-yellow-50 flex-1 font-mono"
              disabled={isPending}
            />
          </div>

          {deadline && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 font-semibold">Status:</span>
              <DeadlineBadge deadline={new Date(deadline)} />
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="space-y-2 pt-2 border-t-2 border-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-black">
              <Paperclip size={16} weight="bold" />
              <span>Lampiran Berkas (Maks 5MB per file)</span>
              <span className="text-neutral-500 font-semibold">({attachments.length})</span>
            </div>

            <div>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="create-card-file-upload"
                disabled={isUploading || isPending}
              />
              <label
                htmlFor="create-card-file-upload"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-transform ${
                  isUploading
                    ? "bg-neutral-200 opacity-60 pointer-events-none"
                    : "bg-yellow-400 hover:bg-yellow-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                }`}
              >
                {isUploading ? (
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                ) : (
                  <UploadSimple size={14} weight="bold" />
                )}
              </label>
            </div>
          </div>

          {attachments.length > 0 && (
            <ul className="space-y-2 max-h-44 overflow-y-auto pt-1">
              {attachments.map((att) => {
                const isImage =
                  att.fileType?.startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(att.fileName);
                const isPdf =
                  att.fileType === "application/pdf" || att.fileName.toLowerCase().endsWith(".pdf");
                const canPreview = isImage || isPdf;

                const dummyAttachment: KanbanCardAttachment = {
                  id: att.id,
                  cardId: "temp-card",
                  fileUrl: att.fileUrl,
                  imagekitFileId: att.imagekitFileId,
                  fileName: att.fileName,
                  fileType: att.fileType,
                  fileSize: att.fileSize,
                  createdAt: new Date(),
                };

                return (
                  <li
                    key={att.id}
                    className="flex items-center justify-between p-2 border-2 border-black bg-neutral-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-50/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        canPreview
                          ? setPreviewAttachment(dummyAttachment)
                          : window.open(att.fileUrl, "_blank")
                      }
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
                      title={canPreview ? "Klik untuk melihat pratinjau berkas" : "Buka berkas"}
                    >
                      {isImage ? (
                        <span className="w-8 h-8 border border-black shrink-0 bg-white group-hover:scale-105 transition-transform overflow-hidden inline-flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full h-full object-cover"
                          />
                        </span>
                      ) : (
                        <span className="p-1.5 bg-neutral-200 border border-black text-neutral-800 shrink-0 group-hover:bg-yellow-300 transition-colors">
                          {isPdf ? (
                            <FileText size={15} weight="bold" />
                          ) : (
                            <Paperclip size={15} weight="bold" />
                          )}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p
                          className="font-bold text-black truncate max-w-[170px] sm:max-w-[210px] group-hover:underline decoration-1"
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
                          onClick={() => setPreviewAttachment(dummyAttachment)}
                          className="p-1 text-black hover:bg-yellow-300 border border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 cursor-pointer"
                          title="Pratinjau langsung"
                        >
                          <Eye size={13} weight="bold" />
                        </button>
                      )}
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => handleRemoveTempAttachment(att.id)}
                        className="p-1 text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors cursor-pointer"
                        title="Hapus lampiran"
                      >
                        <Trash size={13} weight="bold" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end items-center gap-2 pt-3 border-t-2 border-black/10">
          <button
            suppressHydrationWarning
            type="button"
            onClick={onClose}
            disabled={isPending || isUploading}
            className="px-4 py-2 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            suppressHydrationWarning
            type="submit"
            disabled={isPending || isUploading || !title.trim() || !columnId}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer min-w-[120px]"
          >
            {isPending ? (
              <>
                <CircleNotch size={14} weight="bold" className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isUploading ? (
              <>
                <CircleNotch size={14} weight="bold" className="animate-spin" />
                <span>Mengunggah file...</span>
              </>
            ) : (
              <>
                <Plus size={14} weight="bold" />
                <span>Buat Kartu</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Attachment Full Preview Modal (Images & PDFs) */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        open={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
}

export function CreateCardDialog({
  open,
  onClose,
  columns,
  defaultColumnId,
  onCardCreated,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-lg bg-white p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-400 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
              <Kanban size={18} weight="bold" />
            </span>
            <DialogTitle className="font-black text-lg text-black">
              Buat Kartu Kanban Baru
            </DialogTitle>
          </div>
        </DialogHeader>

        {open && (
          <CreateCardForm
            onClose={onClose}
            columns={columns}
            defaultColumnId={defaultColumnId}
            onCardCreated={onCardCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
