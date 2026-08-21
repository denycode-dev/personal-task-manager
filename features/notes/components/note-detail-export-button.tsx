"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { downloadSingleMarkdownNote } from "@/features/notes/utils/markdown-parser";
import { toast } from "sonner";

interface NoteDetailExportButtonProps {
  title: string;
  content: unknown;
  folderName?: string;
  updatedAt?: Date;
  isLocked?: boolean;
}

export function NoteDetailExportButton({
  title,
  content,
  folderName,
  updatedAt,
  isLocked = false,
}: NoteDetailExportButtonProps) {
  if (isLocked) return null;

  const handleExport = () => {
    try {
      downloadSingleMarkdownNote(title, content, {
        folderName,
        updatedAt,
        includeFrontmatter: true,
      });
      toast.success(`Catatan "${title || "Catatan"}" berhasil diekspor ke Markdown!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor catatan ke markdown.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black bg-lime-300 hover:bg-lime-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer"
      title="Ekspor catatan ke Markdown (.md)"
    >
      <DownloadSimple size={14} weight="bold" />
      <span className="hidden sm:inline">Export MD</span>
    </button>
  );
}
