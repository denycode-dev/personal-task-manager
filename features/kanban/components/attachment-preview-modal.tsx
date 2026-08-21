"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DownloadSimple,
  ArrowSquareOut,
  Image as ImageIcon,
  FileText,
  File,
  X,
} from "@phosphor-icons/react";
import type { KanbanCardAttachment } from "@/lib/db/schema";

type Props = {
  attachment: KanbanCardAttachment | null;
  open: boolean;
  onClose: () => void;
};

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function AttachmentPreviewModal({ attachment, open, onClose }: Props) {
  if (!attachment) return null;

  const isImage =
    attachment.fileType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(attachment.fileName);
  const isPdf =
    attachment.fileType === "application/pdf" ||
    attachment.fileName.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 translate-x-0 translate-y-0 sm:-translate-x-1/2 sm:-translate-y-1/2 w-screen h-[100dvh] sm:w-[95vw] sm:h-[92vh] sm:max-w-6xl lg:max-w-7xl max-w-none m-0 p-3 sm:p-5 border-0 sm:border-2 border-black bg-white rounded-none shadow-none sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 overflow-hidden"
      >
        {/* Header Bar */}
        <DialogHeader className="border-b-2 border-black pb-3 flex flex-row items-center justify-between gap-2 sm:gap-3 space-y-0 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <span className="p-1.5 sm:p-2 bg-yellow-400 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black shrink-0">
              {isImage ? (
                <ImageIcon size={18} weight="bold" />
              ) : isPdf ? (
                <FileText size={18} weight="bold" />
              ) : (
                <File size={18} weight="bold" />
              )}
            </span>
            <div className="min-w-0">
              <DialogTitle
                className="font-black text-xs sm:text-base text-black truncate"
                title={attachment.fileName}
              >
                {attachment.fileName}
              </DialogTitle>
              <p className="text-[10px] sm:text-xs text-neutral-500 font-medium truncate">
                {formatBytes(attachment.fileSize)} • {isImage ? "Gambar" : isPdf ? "Dokumen PDF" : attachment.fileType || "Berkas"}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
              title="Buka di tab baru"
            >
              <ArrowSquareOut size={15} weight="bold" />
              <span className="hidden md:inline">Tab Baru</span>
            </a>
            <a
              href={attachment.fileUrl}
              download={attachment.fileName}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
              title="Unduh berkas"
            >
              <DownloadSimple size={15} weight="bold" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
            <button
              suppressHydrationWarning
              type="button"
              onClick={onClose}
              className="p-1.5 border-2 border-black bg-neutral-100 hover:bg-red-100 text-black hover:text-red-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-colors"
              title="Tutup pratinjau"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-neutral-100 border-2 border-black min-h-0 relative">
          {isImage ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-auto p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.fileUrl}
                alt={attachment.fileName}
                className="max-h-full max-w-full object-contain border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] bg-white"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={`${attachment.fileUrl}#toolbar=1&navpanes=0`}
                title={attachment.fileName}
                className="w-full h-full flex-1 border border-black/20 bg-white"
              />
            </div>
          ) : (
            <div className="text-center p-6 sm:p-8 space-y-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm mx-auto">
              <File size={48} weight="bold" className="mx-auto text-neutral-600" />
              <p className="text-sm font-bold text-black">Pratinjau langsung tidak tersedia untuk format ini.</p>
              <p className="text-xs text-neutral-500">Silakan unduh atau buka berkas melalui tab browser baru.</p>
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <ArrowSquareOut size={15} weight="bold" />
                <span>Buka Berkas</span>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
