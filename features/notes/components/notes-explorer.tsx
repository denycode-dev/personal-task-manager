"use client";

import { useState, useMemo, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Folder } from "@/lib/db/schema";
import type {
  EnrichedNote,
  NoteSortOption,
  NoteStatusFilter,
  NoteViewMode,
} from "@/features/notes/types/note.types";
import { deleteNoteAction } from "@/features/notes/actions/delete-note.action";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { NoteImportDialog } from "@/features/notes/components/note-import-dialog";
import { NoteExportDialog } from "@/features/notes/components/note-export-dialog";
import { downloadSingleMarkdownNote } from "@/features/notes/utils/markdown-parser";
import { toast } from "sonner";
import {
  MagnifyingGlass,
  X,
  SquaresFour,
  ListBullets,
  Lock,
  ShareNetwork,
  Plus,
  NotePencil,
  ArrowCounterClockwise,
  ArrowRight,
  Funnel,
  ArrowsDownUp,
  FolderSimple,
  DownloadSimple,
} from "@phosphor-icons/react";

interface NotesExplorerProps {
  initialNotes: EnrichedNote[];
  folders: Folder[];
  initialFolderId?: string;
  initialQuery?: string;
  initialSort?: string;
  initialStatus?: string;
  initialView?: string;
}

export function NotesExplorer({
  initialNotes,
  folders,
  initialFolderId,
  initialQuery = "",
  initialSort = "updated-desc",
  initialStatus = "all",
  initialView = "grid",
}: NotesExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<NoteStatusFilter>(
    (initialStatus as NoteStatusFilter) || "all"
  );
  const [sortBy, setSortBy] = useState<NoteSortOption>(
    (initialSort as NoteSortOption) || "updated-desc"
  );
  const [viewMode, setViewMode] = useState<NoteViewMode>(
    (initialView as NoteViewMode) || "grid"
  );

  // Keyboard shortcut: '/' or 'Ctrl+K' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update URL search parameters without triggering a full-page server re-render
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedFolderId && selectedFolderId !== "all") params.set("folderId", selectedFolderId);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (sortBy !== "updated-desc") params.set("sort", sortBy);
    if (viewMode !== "grid") params.set("view", viewMode);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [searchQuery, selectedFolderId, selectedStatus, sortBy, viewMode, pathname]);

  // Compute folder counts based on all notes
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let uncategorized = 0;
    for (const note of initialNotes) {
      if (!note.folderId) {
        uncategorized++;
      } else {
        counts[note.folderId] = (counts[note.folderId] || 0) + 1;
      }
    }
    return { counts, uncategorized, total: initialNotes.length };
  }, [initialNotes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...initialNotes];

    // 1. Folder filter
    if (selectedFolderId === "none") {
      result = result.filter((n) => !n.folderId);
    } else if (selectedFolderId && selectedFolderId !== "all") {
      result = result.filter((n) => n.folderId === selectedFolderId);
    }

    // 2. Status filter
    if (selectedStatus === "locked") {
      result = result.filter((n) => n.isLocked);
    } else if (selectedStatus === "shared") {
      result = result.filter((n) => n.isShared);
    } else if (selectedStatus === "normal") {
      result = result.filter((n) => !n.isLocked && !n.isShared);
    }

    // 3. Search query (matches title or snippet text)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.snippet && n.snippet.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "updated-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "created-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "created-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "", "id", { sensitivity: "base" });
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "", "id", { sensitivity: "base" });
        case "updated-desc":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [initialNotes, selectedFolderId, selectedStatus, searchQuery, sortBy]);

  // Check if any filter is active
  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedFolderId !== "all" ||
    selectedStatus !== "all" ||
    sortBy !== "updated-desc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedFolderId("all");
    setSelectedStatus("all");
    setSortBy("updated-desc");
  };

  const selectedFolderObj = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-black">Catatan</h1>
            <span className="px-2 py-0.5 text-xs font-black bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {initialNotes.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
            Dokumentasi, ide, dan catatan terenkripsi dengan pencarian cepat
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <NoteImportDialog
            folders={folders}
            currentFolderId={selectedFolderId}
          />
          <NoteExportDialog
            allNotes={initialNotes}
            filteredNotes={filteredNotes}
            folders={folders}
            currentFolderId={selectedFolderId}
            isFilterActive={isFilterActive}
          />
          <Link
            href="/notes/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-black bg-yellow-400 font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Tulis Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Control Toolbar (Search, Filter, Sort, View Toggle) */}
      <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau isi catatan... (Tekan '/' untuk mencari)"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-neutral-50 border-2 border-black font-medium text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-black hover:bg-neutral-200 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Controls: Status, Sort, View */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as NoteStatusFilter)}
                className="w-full sm:w-auto appearance-none pl-8 pr-7 py-2 text-xs font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:outline-none"
                aria-label="Filter status catatan"
              >
                <option value="all">Semua Status</option>
                <option value="locked">🔒 Terkunci Saja</option>
                <option value="shared">🌐 Publik Saja</option>
                <option value="normal">📝 Catatan Bebas</option>
              </select>
              <Funnel
                size={14}
                weight="bold"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
              />
            </div>

            {/* Sort Selector */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
                className="w-full sm:w-auto appearance-none pl-8 pr-7 py-2 text-xs font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:outline-none"
                aria-label="Urutkan catatan"
              >
                <option value="updated-desc">Terbaru Diperbarui</option>
                <option value="updated-asc">Terlama Diperbarui</option>
                <option value="created-desc">Terbaru Dibuat</option>
                <option value="created-asc">Terlama Dibuat</option>
                <option value="title-asc">Judul (A - Z)</option>
                <option value="title-desc">Judul (Z - A)</option>
              </select>
              <ArrowsDownUp
                size={14}
                weight="bold"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-yellow-400 text-black"
                    : "bg-white text-neutral-500 hover:bg-neutral-100"
                }`}
                title="Tampilan Grid (Kartu)"
                aria-label="Tampilan Grid"
              >
                <SquaresFour size={16} weight={viewMode === "grid" ? "fill" : "bold"} />
              </button>
              <div className="w-[2px] bg-black" />
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-yellow-400 text-black"
                    : "bg-white text-neutral-500 hover:bg-neutral-100"
                }`}
                title="Tampilan List (Tabel Kompak)"
                aria-label="Tampilan List"
              >
                <ListBullets size={16} weight={viewMode === "list" ? "fill" : "bold"} />
              </button>
            </div>
          </div>
        </div>

        {/* Folder Filter Bar (Horizontal Pills) */}
        <div className="pt-2 border-t border-black/10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFolderId("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
              selectedFolderId === "all"
                ? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
                : "bg-white text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
              {folderCounts.total}
            </span>
          </button>

          {folderCounts.uncategorized > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFolderId("none")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                selectedFolderId === "none"
                  ? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span>Tanpa Folder</span>
              <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
                {folderCounts.uncategorized}
              </span>
            </button>
          )}

          {folders.map((f) => {
            const count = folderCounts.counts[f.id] || 0;
            const isSelected = selectedFolderId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFolderId(f.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
                    : "bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                  style={{ backgroundColor: f.color }}
                />
                <span className="truncate max-w-[140px]">{f.name}</span>
                <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Filters Bar & Summary */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-100 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">
              Menampilkan {filteredNotes.length} dari {initialNotes.length} catatan
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-black text-[11px]">
                <span>Cari: &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-neutral-500 hover:text-black cursor-pointer ml-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}

            {selectedFolderId !== "all" && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-black text-[11px]">
                <span>
                  Folder:{" "}
                  {selectedFolderId === "none"
                    ? "Tanpa Folder"
                    : selectedFolderObj?.name || "Folder"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId("all")}
                  className="text-neutral-500 hover:text-black cursor-pointer ml-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}

            {selectedStatus !== "all" && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-black text-[11px]">
                <span>
                  Status:{" "}
                  {selectedStatus === "locked"
                    ? "Terkunci"
                    : selectedStatus === "shared"
                    ? "Publik"
                    : "Catatan Bebas"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  className="text-neutral-500 hover:text-black cursor-pointer ml-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 underline font-bold cursor-pointer shrink-0"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}

      {/* 4. Notes List View / Grid View */}
      {initialNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-yellow-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <NotePencil size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">Belum ada catatan.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Mulai tulis catatan pertamamu sekarang dengan rich-text editor bebas gangguan.
          </p>
          <div className="pt-2">
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Catatan Baru</span>
            </Link>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-neutral-50 space-y-3">
          <div className="inline-flex p-3.5 bg-neutral-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <MagnifyingGlass size={32} weight="bold" className="text-neutral-600" />
          </div>
          <p className="text-base font-black text-black">Tidak ada catatan yang cocok.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan opsi filter folder dan status.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-transform cursor-pointer"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span>Hapus Semua Filter</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const folder = folders.find((f) => f.id === note.folderId);
            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {folder ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate max-w-[120px]">{folder.name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        Tanpa Folder
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {note.isLocked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black">
                          <Lock size={10} weight="fill" />
                          Kunci
                        </span>
                      )}
                      {note.isShared && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-purple-200 text-purple-900 border border-black">
                          <ShareNetwork size={10} weight="bold" />
                          Publik
                        </span>
                      )}
                      {!note.isLocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            downloadSingleMarkdownNote(note.title, note.content, {
                              folderName: folder?.name,
                              updatedAt: note.updatedAt,
                              includeFrontmatter: true,
                            });
                            toast.success(`Catatan "${note.title || "Catatan"}" berhasil diekspor ke Markdown!`);
                          }}
                          className="p-1 text-muted-foreground hover:text-black hover:bg-lime-200 border border-transparent hover:border-black rounded-xs transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Ekspor catatan ini ke Markdown (.md)"
                        >
                          <DownloadSimple size={14} weight="bold" />
                        </button>
                      )}
                      <DeleteConfirmButton
                        action={deleteNoteAction.bind(null, note.id)}
                        confirmTitle="Hapus Catatan"
                        confirmMessage={`Hapus catatan "${note.title || "Catatan tanpa judul"}"? Tindakan ini akan menghapus catatan secara permanen.`}
                        successMessage="Catatan berhasil dihapus."
                        className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                        iconSize={14}
                      />
                    </div>
                  </div>

                  <Link href={`/notes/${note.id}`} className="block">
                    <h2 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                      {note.title || "Catatan tanpa judul"}
                    </h2>
                  </Link>

                  {note.isLocked ? (
                    <div className="relative mt-2 p-2 bg-neutral-100/90 border border-black/10 overflow-hidden select-none">
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed filter blur-[4px] select-none pointer-events-none opacity-40">
                        {note.snippet ||
                          "Konten catatan ini terenkripsi aman dengan AES-256-GCM. Buka catatan dan masukkan password untuk membaca isinya."}
                      </p>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-neutral-900 bg-yellow-300 px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          <Lock size={10} weight="fill" />
                          Deskripsi Terkunci
                        </span>
                      </div>
                    </div>
                  ) : note.snippet ? (
                    <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {note.snippet}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-400 italic">
                      Catatan masih kosong...
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/notes/${note.id}`}
                    className="inline-flex items-center gap-1 text-black font-bold group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Buka</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode View (Compact Table Rows) */
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <ul className="divide-y-2 divide-black/10">
            {filteredNotes.map((note) => {
              const folder = folders.find((f) => f.id === note.folderId);
              return (
                <li
                  key={note.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-yellow-50/50 transition-colors gap-3"
                >
                  <Link
                    href={`/notes/${note.id}`}
                    className="flex items-start sm:items-center gap-3 min-w-0 flex-1"
                  >
                    <span
                      className={`p-2 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 ${
                        note.isLocked
                          ? "bg-neutral-900 text-yellow-400"
                          : note.isShared
                          ? "bg-purple-200 text-purple-900"
                          : "bg-yellow-200 text-neutral-900"
                      }`}
                    >
                      {note.isLocked ? (
                        <Lock size={16} weight="fill" />
                      ) : note.isShared ? (
                        <ShareNetwork size={16} weight="bold" />
                      ) : (
                        <NotePencil size={16} weight="bold" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-sm sm:text-base text-black truncate group-hover:underline decoration-2">
                          {note.title || "Catatan tanpa judul"}
                        </h2>
                        {note.isLocked && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black">
                            Kunci
                          </span>
                        )}
                        {note.isShared && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-purple-200 text-purple-900 border border-black">
                            Publik
                          </span>
                        )}
                      </div>
                      {note.isLocked ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-neutral-500 truncate max-w-xs sm:max-w-md filter blur-[3px] select-none pointer-events-none opacity-40">
                            {note.snippet || "Konten terenkripsi aman dengan proteksi password."}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 border border-black/20 shrink-0">
                            <Lock size={9} weight="fill" />
                            Terkunci
                          </span>
                        </div>
                      ) : note.snippet ? (
                        <p className="text-xs text-muted-foreground truncate max-w-lg mt-0.5">
                          {note.snippet}
                        </p>
                      ) : null}
                    </div>
                  </Link>


                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
                    {folder ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 border border-black/20">
                        <span
                          className="inline-block w-2 h-2 rounded-xs border border-black"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate max-w-[100px]">{folder.name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        Tanpa Folder
                      </span>
                    )}

                    <span className="text-[11px] text-muted-foreground font-medium hidden md:inline">
                      {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <Link
                      href={`/notes/${note.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-yellow-400 border border-black text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                    >
                      <span>Buka</span>
                      <ArrowRight size={12} weight="bold" />
                    </Link>

                    {!note.isLocked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          downloadSingleMarkdownNote(note.title, note.content, {
                            folderName: folder?.name,
                            updatedAt: note.updatedAt,
                            includeFrontmatter: true,
                          });
                          toast.success(`Catatan "${note.title || "Catatan"}" berhasil diekspor ke Markdown!`);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-black hover:bg-lime-200 border border-black/20 hover:border-black rounded-xs transition-colors inline-flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-white"
                        title="Ekspor catatan ini ke Markdown (.md)"
                      >
                        <DownloadSimple size={13} weight="bold" />
                      </button>
                    )}

                    <DeleteConfirmButton
                      action={deleteNoteAction.bind(null, note.id)}
                      confirmTitle="Hapus Catatan"
                      confirmMessage={`Hapus catatan "${note.title || "Catatan tanpa judul"}"? Tindakan ini akan menghapus catatan secara permanen.`}
                      successMessage="Catatan berhasil dihapus."
                      className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                      iconSize={14}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
