"use client";

import { useState, useRef, useTransition, useId } from "react";
import { useRouter } from "next/navigation";
import type { Folder } from "@/lib/db/schema";
import {
  FileArrowUp,
  X,
  Trash,
  Check,
  FolderSimple,
  CircleNotch,
  WarningCircle,
  FileText,
  Archive,
  Plus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  parseMarkdownToTiptap,
  extractMarkdownFilesFromZip,
  type ParsedMarkdownNote,
} from "@/features/notes/utils/markdown-parser";
import { importNotesAction } from "@/features/notes/actions/import-notes.action";

interface NoteImportDialogProps {
  folders: Folder[];
  currentFolderId?: string;
}

interface ImportItem extends ParsedMarkdownNote {
  id: string;
  selectedFolderId?: string | null;
}

export function NoteImportDialog({
  folders,
  currentFolderId,
}: NoteImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [globalFolderId, setGlobalFolderId] = useState<string>(
    currentFolderId && currentFolderId !== "all" && currentFolderId !== "none"
      ? currentFolderId
      : ""
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setIsOpen(true);
    setItems([]);
    setGlobalFolderId(
      currentFolderId && currentFolderId !== "all" && currentFolderId !== "none"
        ? currentFolderId
        : ""
    );
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setItems([]);
  };

  const processFiles = async (files: FileList | File[]) => {
    setIsParsing(true);
    const newItems: ImportItem[] = [];

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "zip") {
          const zipNotes = await extractMarkdownFilesFromZip(file);
          for (const note of zipNotes) {
            // Check if note folder matches existing folders
            let matchedFolderId: string | null = null;
            if (note.folderName) {
              const f = folders.find(
                (fol) => fol.name.toLowerCase() === note.folderName?.toLowerCase()
              );
              if (f) matchedFolderId = f.id;
            }

            newItems.push({
              ...note,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              selectedFolderId: matchedFolderId || (globalFolderId || null),
            });
          }
        } else if (ext === "md" || ext === "markdown" || ext === "txt") {
          const text = await file.text();
          const fallbackTitle = file.name.replace(/\.(md|markdown|txt)$/i, "");
          const parsed = parseMarkdownToTiptap(text, fallbackTitle);

          let matchedFolderId: string | null = null;
          if (parsed.folderName) {
            const f = folders.find(
              (fol) => fol.name.toLowerCase() === parsed.folderName?.toLowerCase()
            );
            if (f) matchedFolderId = f.id;
          }

          newItems.push({
            ...parsed,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            selectedFolderId: matchedFolderId || (globalFolderId || null),
          });
        }
      }

      if (newItems.length === 0) {
        toast.error("Tidak ada file markdown (.md, .markdown, .txt, .zip) yang valid.");
      } else {
        setItems((prev) => [...prev, ...newItems]);
        toast.success(`${newItems.length} catatan berhasil dimuat untuk ditinjau.`);
      }
    } catch (err) {
      console.error("Error parsing files:", err);
      toast.error("Terjadi kesalahan saat memproses file.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleFolderChange = (id: string, folderId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, selectedFolderId: folderId ? folderId : null }
          : item
      )
    );
  };

  const handleApplyGlobalFolder = (folderId: string) => {
    setGlobalFolderId(folderId);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selectedFolderId: folderId ? folderId : null,
      }))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExecuteImport = () => {
    if (items.length === 0) return;

    startTransition(async () => {
      const payload = items.map((item) => ({
        title: item.title.trim() || "Catatan tanpa judul",
        content: item.content,
        folderId: item.selectedFolderId || null,
      }));

      const res = await importNotesAction(payload);
      if (res.success) {
        toast.success(
          `🎉 Berhasil mengimpor ${res.data.count} catatan ke sistem!`
        );
        setIsOpen(false);
        setItems([]);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengimpor catatan.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black bg-cyan-300 hover:bg-cyan-200 font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
        title="Impor catatan dari format Markdown (.md atau .zip)"
      >
        <FileArrowUp size={16} weight="bold" />
        <span className="hidden sm:inline">Import MD</span>
        <span className="sm:hidden">Import</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-dialog-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black px-4 sm:px-6 py-3 bg-cyan-300 select-none">
              <div className="flex items-center gap-2">
                <FileArrowUp size={20} weight="bold" />
                <h2 id="import-dialog-title" className="font-black text-base sm:text-lg text-black">
                  Impor Catatan Markdown
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="p-1 text-black hover:bg-black/10 rounded-sm cursor-pointer disabled:opacity-50"
                title="Tutup dialog"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Dropzone Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-black p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "bg-cyan-100 border-cyan-700 scale-[0.99]"
                    : "bg-neutral-50 hover:bg-neutral-100/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".md,.markdown,.txt,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-cyan-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
                    {isParsing ? (
                      <CircleNotch size={24} weight="bold" className="animate-spin text-black" />
                    ) : (
                      <FileArrowUp size={24} weight="bold" className="text-black" />
                    )}
                  </div>

                  <p className="font-black text-sm text-black">
                    {isParsing
                      ? "Sedang membaca dan mengurai file markdown..."
                      : "Tarik & lepas file .md / .zip ke sini, atau klik untuk memilih file"}
                  </p>

                  <p className="text-xs text-neutral-500 max-w-sm">
                    Mendukung file <code className="bg-neutral-200 px-1 py-0.5 border border-black/20 text-black font-mono">.md</code>,{" "}
                    <code className="bg-neutral-200 px-1 py-0.5 border border-black/20 text-black font-mono">.markdown</code>,{" "}
                    <code className="bg-neutral-200 px-1 py-0.5 border border-black/20 text-black font-mono">.txt</code>, atau arsip{" "}
                    <code className="bg-neutral-200 px-1 py-0.5 border border-black/20 text-black font-mono">.zip</code>.
                  </p>
                </div>
              </div>

              {/* Items Preview Table */}
              {items.length > 0 && (
                <div className="space-y-3 pt-2">
                  {/* Top Bar for Batch Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-black bg-cyan-300 border border-black">
                        {items.length} Catatan Terdeteksi
                      </span>
                      <span className="text-xs text-neutral-600 font-medium hidden md:inline">
                        Periksa judul & folder sebelum disimpan
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-700 shrink-0">
                        Folder Massal:
                      </span>
                      <select
                        value={globalFolderId}
                        onChange={(e) => handleApplyGlobalFolder(e.target.value)}
                        className="text-xs font-bold bg-white border border-black px-2 py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                      >
                        <option value="">Tanpa Folder</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scrollable list of items */}
                  <div className="border-2 border-black divide-y-2 divide-black/10 max-h-60 overflow-y-auto bg-white">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText size={16} weight="bold" className="text-neutral-500 shrink-0" />
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleTitleChange(item.id, e.target.value)}
                              placeholder="Judul catatan..."
                              className="font-bold text-xs sm:text-sm text-black border border-neutral-300 focus:border-black px-1.5 py-0.5 bg-white w-full rounded-xs"
                            />
                          </div>

                          {item.snippet && (
                            <p className="text-[11px] text-neutral-500 truncate pl-6">
                              {item.snippet}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                          <select
                            value={item.selectedFolderId || ""}
                            onChange={(e) => handleFolderChange(item.id, e.target.value)}
                            className="text-[11px] font-bold bg-white border border-black px-2 py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                          >
                            <option value="">Tanpa Folder</option>
                            {folders.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer"
                            title="Hapus dari daftar impor"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black p-4 bg-neutral-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-200 font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isPending || items.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 border-2 border-black bg-cyan-400 hover:bg-cyan-300 font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <CircleNotch size={16} weight="bold" className="animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} weight="bold" />
                    <span>Impor {items.length > 0 ? `${items.length} ` : ""}Catatan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
