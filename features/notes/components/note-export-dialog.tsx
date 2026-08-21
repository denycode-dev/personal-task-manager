"use client";

import { useState } from "react";
import type { Folder } from "@/lib/db/schema";
import type { EnrichedNote } from "@/features/notes/types/note.types";
import {
  FileArrowDown,
  X,
  Archive,
  FileText,
  Check,
  CircleNotch,
  FolderSimple,
  Sliders,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  downloadNotesZip,
  downloadCombinedMarkdown,
} from "@/features/notes/utils/markdown-parser";

interface NoteExportDialogProps {
  allNotes: EnrichedNote[];
  filteredNotes: EnrichedNote[];
  folders: Folder[];
  currentFolderId?: string;
  isFilterActive?: boolean;
}

export function NoteExportDialog({
  allNotes,
  filteredNotes,
  folders,
  currentFolderId,
  isFilterActive = false,
}: NoteExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "filtered" | "folder">(
    isFilterActive ? "filtered" : "all"
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    currentFolderId && currentFolderId !== "all" && currentFolderId !== "none"
      ? currentFolderId
      : folders[0]?.id || ""
  );
  const [format, setFormat] = useState<"zip" | "combined">("zip");
  const [includeFrontmatter, setIncludeFrontmatter] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setScope(isFilterActive ? "filtered" : "all");
  };

  const handleClose = () => {
    if (isExporting) return;
    setIsOpen(false);
  };

  // Determine which notes will be exported based on scope
  const getNotesToExport = () => {
    switch (scope) {
      case "filtered":
        return filteredNotes;
      case "folder":
        return allNotes.filter((n) => n.folderId === selectedFolderId);
      case "all":
      default:
        return allNotes;
    }
  };

  const notesToExport = getNotesToExport();

  const handleExecuteExport = async () => {
    if (notesToExport.length === 0) {
      toast.error("Tidak ada catatan yang dipilih untuk diekspor.");
      return;
    }

    setIsExporting(true);
    try {
      // Map notes with folder names
      const folderMap = new Map(folders.map((f) => [f.id, f.name]));
      const mappedNotes = notesToExport.map((note) => ({
        title: note.title || "Catatan tanpa judul",
        content: note.content,
        folderName: note.folderId ? folderMap.get(note.folderId) : undefined,
        updatedAt: note.updatedAt,
      }));

      const dateTag = new Date().toISOString().split("T")[0];

      if (format === "zip") {
        await downloadNotesZip(mappedNotes, {
          zipFilename: `catatan-${scope}-${dateTag}.zip`,
          includeFrontmatter,
        });
        toast.success(`🎉 Berhasil mengekspor ${mappedNotes.length} catatan dalam format ZIP!`);
      } else {
        downloadCombinedMarkdown(
          mappedNotes,
          `koleksi-catatan-${scope}-${dateTag}.md`
        );
        toast.success(`🎉 Berhasil mengekspor ${mappedNotes.length} catatan dalam 1 file Markdown!`);
      }

      setIsOpen(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Terjadi kesalahan saat memproses ekspor catatan.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black bg-lime-300 hover:bg-lime-200 font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
        title="Ekspor catatan ke format Markdown (.md atau .zip)"
      >
        <FileArrowDown size={16} weight="bold" />
        <span className="hidden sm:inline">Export MD</span>
        <span className="sm:hidden">Export</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-lg border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-dialog-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black px-4 sm:px-6 py-3 bg-lime-300 select-none">
              <div className="flex items-center gap-2">
                <FileArrowDown size={20} weight="bold" />
                <h2 id="export-dialog-title" className="font-black text-base sm:text-lg text-black">
                  Ekspor Catatan Markdown
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isExporting}
                className="p-1 text-black hover:bg-black/10 rounded-sm cursor-pointer disabled:opacity-50"
                title="Tutup dialog"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* 1. Scope Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                  1. Pilih Cakupan Catatan
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`flex items-center justify-between p-3 border-2 border-black cursor-pointer transition-all ${
                      scope === "all"
                        ? "bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="export-scope"
                        checked={scope === "all"}
                        onChange={() => setScope("all")}
                        className="accent-black"
                      />
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-black">Semua Catatan</p>
                        <p className="text-[11px] text-neutral-500">
                          Seluruh catatan yang tersimpan di sistem
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-mono font-bold rounded-xs">
                      {allNotes.length}
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 border-2 border-black cursor-pointer transition-all ${
                      scope === "filtered"
                        ? "bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="export-scope"
                        checked={scope === "filtered"}
                        onChange={() => setScope("filtered")}
                        className="accent-black"
                      />
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-black">
                          Catatan Sesuai Filter Saat Ini
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Hanya catatan yang sedang tampil di layar
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-mono font-bold rounded-xs">
                      {filteredNotes.length}
                    </span>
                  </label>

                  {folders.length > 0 && (
                    <label
                      className={`flex flex-col p-3 border-2 border-black cursor-pointer transition-all gap-2 ${
                        scope === "folder"
                          ? "bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="export-scope"
                            checked={scope === "folder"}
                            onChange={() => setScope("folder")}
                            className="accent-black"
                          />
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-black">
                              Berdasarkan Folder Spesifik
                            </p>
                            <p className="text-[11px] text-neutral-500">
                              Hanya catatan di dalam folder terpilih
                            </p>
                          </div>
                        </div>
                      </div>

                      {scope === "folder" && (
                        <div className="pl-6 pt-1">
                          <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full text-xs font-bold bg-white border border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                          >
                            {folders.map((f) => (
                              <option key={f.id} value={f.id}>
                                📁 {f.name} (
                                {allNotes.filter((n) => n.folderId === f.id).length} catatan)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* 2. Format Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                  2. Pilih Format Berkas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2.5 p-3 border-2 border-black cursor-pointer transition-all ${
                      format === "zip"
                        ? "bg-lime-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      checked={format === "zip"}
                      onChange={() => setFormat("zip")}
                      className="accent-black mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <Archive size={16} weight="bold" />
                        <span className="font-black text-xs text-black">Arsip ZIP (.zip)</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                        File .md individual yang tersusun rapi dalam folder.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 border-2 border-black cursor-pointer transition-all ${
                      format === "combined"
                        ? "bg-lime-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      checked={format === "combined"}
                      onChange={() => setFormat("combined")}
                      className="accent-black mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <FileText size={16} weight="bold" />
                        <span className="font-black text-xs text-black">File Tunggal (.md)</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                        Semua catatan disatukan lengkap dengan Daftar Isi.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Metadata Options */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                  3. Opsi Tambahan
                </label>
                <label className="flex items-center gap-2.5 p-3 bg-neutral-50 border-2 border-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFrontmatter}
                    onChange={(e) => setIncludeFrontmatter(e.target.checked)}
                    className="accent-black w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-xs text-black">
                      Sertakan YAML Frontmatter
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Menyimpan metadata judul, tanggal, dan folder di bagian atas file untuk kompatibilitas dengan Obsidian / Notion / Logseq.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black p-4 bg-neutral-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isExporting}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-200 font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={isExporting || notesToExport.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 border-2 border-black bg-lime-400 hover:bg-lime-300 font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <CircleNotch size={16} weight="bold" className="animate-spin" />
                    <span>Mempersiapkan Berkas...</span>
                  </>
                ) : (
                  <>
                    <FileArrowDown size={16} weight="bold" />
                    <span>Unduh {notesToExport.length} Catatan</span>
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
