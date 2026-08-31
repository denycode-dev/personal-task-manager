"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Folder } from "@/lib/db/schema";
import { folderService } from "@/features/folders/services/folder.service";
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
  SlidersHorizontal,
  DownloadSimple,
  CalendarBlank,
  Globe,
  CaretRight,
  Check,
  FileArrowUp,
  FileArrowDown,
} from "@phosphor-icons/react";
import { FolderShareDialog } from "@/features/folders/components/folder-share-dialog";

interface NotesExplorerProps {
  initialNotes: EnrichedNote[];
  folders: Folder[];
  sharedFolderMap?: Record<string, string>;
  initialFolderId?: string;
  initialQuery?: string;
  initialSort?: string;
  initialStatus?: string;
  initialView?: string;
}

export function NotesExplorer({
  initialNotes,
  folders,
  sharedFolderMap = {},
  initialFolderId,
  initialQuery = "",
  initialSort = "updated-desc",
  initialStatus = "all",
  initialView = "grid",
}: NotesExplorerProps) {
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || "all"
  );
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<NoteStatusFilter>(
    (initialStatus as NoteStatusFilter) || "all"
  );
  const [sortBy, setSortBy] = useState<NoteSortOption>(
    (initialSort as NoteSortOption) || "updated-desc"
  );
  const [viewMode, setViewMode] = useState<NoteViewMode>(
    (initialView as NoteViewMode) || "grid"
  );
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const hierarchicalFolders = useMemo(() => {
    return folderService.getFolderHierarchy(folders);
  }, [folders]);

  const folderPathMap = useMemo(() => {
    const map = new Map<string, { path: string; color: string; name: string }>();
    for (const h of hierarchicalFolders) {
      map.set(h.id, { path: h.path, color: h.color, name: h.name });
    }
    return map;
  }, [hierarchicalFolders]);

  // Compute breadcrumbs & subfolders for selected folder
  const activeFolderBreadcrumbs = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "none") return [];
    return folderService.getFolderPath(selectedFolderId, folders);
  }, [selectedFolderId, folders]);

  const activeDirectSubfolders = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "none") return [];
    return folders.filter((f) => f.parentId === selectedFolderId);
  }, [selectedFolderId, folders]);

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

  // Update URL search parameters
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

  // Compute folder counts
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
      if (includeSubfolders) {
        const descendantIds = folderService.getDescendantFolderIds(selectedFolderId, folders);
        const targetIds = new Set([selectedFolderId, ...descendantIds]);
        result = result.filter((n) => n.folderId && targetIds.has(n.folderId));
      } else {
        result = result.filter((n) => n.folderId === selectedFolderId);
      }
    }

    // 2. Status filter
    if (selectedStatus === "locked") {
      result = result.filter((n) => n.isLocked);
    } else if (selectedStatus === "shared") {
      result = result.filter((n) => n.isShared);
    } else if (selectedStatus === "normal") {
      result = result.filter((n) => !n.isLocked && !n.isShared);
    }

    // 3. Search query
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
  }, [initialNotes, selectedFolderId, selectedStatus, searchQuery, sortBy, includeSubfolders, folders]);

  // Check if any filter is active
  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedFolderId !== "all" ||
    selectedStatus !== "all" ||
    sortBy !== "updated-desc";

  const secondaryFiltersCount =
    (selectedStatus !== "all" ? 1 : 0) + (sortBy !== "updated-desc" ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedFolderId("all");
    setSelectedStatus("all");
    setSortBy("updated-desc");
  };

  const selectedFolderObj = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header Section (Clean & Minimal) */}
      <header className="flex items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
              Catatan
            </h1>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-full">
              {initialNotes.length}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium hidden sm:block mt-0.5">
            Kumpulan ide, dokumen, dan draf catatan Anda
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {selectedFolderObj && (
            <FolderShareDialog
              folderId={selectedFolderObj.id}
              folderName={selectedFolderObj.name}
              folderColor={selectedFolderObj.color}
              initialIsShared={Boolean(sharedFolderMap[selectedFolderObj.id])}
              initialSlug={sharedFolderMap[selectedFolderObj.id] ?? null}
              notesCount={folderCounts.counts[selectedFolderObj.id] || 0}
              triggerButton={
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border transition-colors rounded cursor-pointer ${
                    sharedFolderMap[selectedFolderObj.id]
                      ? "bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200"
                      : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
                  }`}
                  title="Bagikan folder aktif"
                >
                  <Globe size={14} weight="bold" />
                  <span className="hidden md:inline">
                    {sharedFolderMap[selectedFolderObj.id] ? "Folder Publik" : "Bagikan Folder"}
                  </span>
                </button>
              }
            />
          )}

          <NoteImportDialog
            folders={folders}
            currentFolderId={selectedFolderId}
            triggerButton={
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black border border-neutral-300 hover:border-black transition-colors rounded cursor-pointer min-h-[36px]"
                title="Impor catatan Markdown (.md / .zip)"
              >
                <FileArrowUp size={15} weight="bold" />
                <span className="hidden sm:inline">Impor</span>
              </button>
            }
          />
          
          <NoteExportDialog
            allNotes={initialNotes}
            filteredNotes={filteredNotes}
            folders={folders}
            currentFolderId={selectedFolderId}
            isFilterActive={isFilterActive}
            triggerButton={
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black border border-neutral-300 hover:border-black transition-colors rounded cursor-pointer min-h-[36px]"
                title="Ekspor catatan Markdown (.md / .zip)"
              >
                <FileArrowDown size={15} weight="bold" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>
            }
          />

          <Link
            href="/notes/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-black text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded cursor-pointer min-h-[36px]"
          >
            <Plus size={16} weight="bold" />
            <span>Tulis Catatan</span>
          </Link>
        </div>
      </header>

      {/* 2. Unified Search, Filter Controls & Folder Navigation */}
      <div className="bg-white border border-neutral-200 shadow-xs rounded-lg p-2.5 sm:p-3 space-y-2.5">
        {/* Search Row + Filter Toggles */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan... (Tekan '/')"
              className="w-full pl-8 pr-8 py-1.5 text-xs sm:text-sm bg-neutral-50/80 border border-neutral-200 font-medium text-neutral-900 placeholder:text-neutral-400 rounded focus:bg-white focus:border-black focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilterPanel((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border transition-colors rounded cursor-pointer shrink-0 ${
              showFilterPanel || secondaryFiltersCount > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200 hover:border-black"
            }`}
            title="Pengaturan Filter & Urutan"
          >
            <SlidersHorizontal size={14} weight="bold" />
            <span className="hidden sm:inline">Filter</span>
            {secondaryFiltersCount > 0 && (
              <span className="w-4 h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                {secondaryFiltersCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-neutral-200 bg-neutral-50 rounded overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-black"
              }`}
              title="Tampilan Grid (Kartu)"
              aria-label="Tampilan Grid"
            >
              <SquaresFour size={16} weight={viewMode === "grid" ? "fill" : "bold"} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-black"
              }`}
              title="Tampilan List (Daftar)"
              aria-label="Tampilan List"
            >
              <ListBullets size={16} weight={viewMode === "list" ? "fill" : "bold"} />
            </button>
          </div>
        </div>

        {/* Collapsible Secondary Filter Row (Status & Sort) */}
        {showFilterPanel && (
          <div className="pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-100">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-neutral-500 shrink-0 w-12">
                Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as NoteStatusFilter)}
                className="flex-1 py-1 px-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded cursor-pointer focus:outline-none focus:border-black"
                aria-label="Filter status catatan"
              >
                <option value="all">Semua Status</option>
                <option value="locked">🔒 Terkunci Saja</option>
                <option value="shared">🌐 Publik Saja</option>
                <option value="normal">📝 Catatan Bebas</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-neutral-500 shrink-0 w-12 sm:w-auto">
                Urutkan:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
                className="flex-1 py-1 px-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded cursor-pointer focus:outline-none focus:border-black"
                aria-label="Urutkan catatan"
              >
                <option value="updated-desc">Terbaru Diperbarui</option>
                <option value="updated-asc">Terlama Diperbarui</option>
                <option value="created-desc">Terbaru Dibuat</option>
                <option value="created-asc">Terlama Dibuat</option>
                <option value="title-asc">Judul (A - Z)</option>
                <option value="title-desc">Judul (Z - A)</option>
              </select>
            </div>
          </div>
        )}

        {/* Horizontal Scrollable Folder Pills */}
        <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFolderId("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer shrink-0 border ${
              selectedFolderId === "all"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <span>Semua</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                selectedFolderId === "all" ? "bg-neutral-700 text-yellow-300" : "bg-neutral-200 text-neutral-700"
              }`}
            >
              {folderCounts.total}
            </span>
          </button>

          {folderCounts.uncategorized > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFolderId("none")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer shrink-0 border ${
                selectedFolderId === "none"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <span>Tanpa Folder</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedFolderId === "none" ? "bg-neutral-700 text-yellow-300" : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {folderCounts.uncategorized}
              </span>
            </button>
          )}

          {hierarchicalFolders.map((f) => {
            const count = folderCounts.counts[f.id] || 0;
            const isSelected = selectedFolderId === f.id;
            const isFolderShared = Boolean(sharedFolderMap[f.id]);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFolderId(f.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: f.color }}
                />
                <span className="truncate max-w-[120px]">{f.name}</span>
                {isFolderShared && (
                  <span title="Folder Publik Aktif" className="text-purple-400">
                    <Globe size={12} weight="bold" />
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? "bg-neutral-700 text-yellow-300" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Folder Breadcrumb & Subfolder Row */}
        {activeFolderBreadcrumbs.length > 0 && (
          <div className="pt-1.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 flex-wrap text-neutral-500 text-[11px]">
              <span>Jalur:</span>
              <button
                type="button"
                onClick={() => setSelectedFolderId("all")}
                className="font-semibold text-neutral-700 hover:underline cursor-pointer"
              >
                Semua
              </button>
              {activeFolderBreadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-1">
                  <CaretRight size={10} weight="bold" className="text-neutral-400" />
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(crumb.id)}
                    className={`font-semibold hover:underline cursor-pointer flex items-center gap-1 ${
                      idx === activeFolderBreadcrumbs.length - 1
                        ? "text-neutral-900 font-bold"
                        : "text-neutral-600"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: crumb.color }}
                    />
                    <span>{crumb.name}</span>
                  </button>
                </div>
              ))}
            </div>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-neutral-600">
              <input
                type="checkbox"
                checked={includeSubfolders}
                onChange={(e) => setIncludeSubfolders(e.target.checked)}
                className="accent-black cursor-pointer rounded"
              />
              <span>Sertakan Subfolder</span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Active Filters Indicator */}
      {isFilterActive && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-neutral-500 font-medium">
              Menampilkan {filteredNotes.length} dari {initialNotes.length} catatan
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-neutral-200 rounded text-[11px] font-semibold text-neutral-800">
                <span>&quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
            {selectedFolderId !== "all" && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-neutral-200 rounded text-[11px] font-semibold text-neutral-800">
                <span>
                  {selectedFolderId === "none" ? "Tanpa Folder" : selectedFolderObj?.name || "Folder"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId("all")}
                  className="text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
            {selectedStatus !== "all" && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-neutral-200 rounded text-[11px] font-semibold text-neutral-800">
                <span>
                  {selectedStatus === "locked"
                    ? "Terkunci"
                    : selectedStatus === "shared"
                    ? "Publik"
                    : "Catatan Bebas"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  className="text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-bold cursor-pointer shrink-0"
          >
            <ArrowCounterClockwise size={12} weight="bold" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* 4. Notes List / Grid */}
      {initialNotes.length === 0 ? (
        /* Empty Global State */
        <div className="text-center py-16 px-4 bg-white border border-neutral-200 rounded-lg space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-yellow-100 text-neutral-900 rounded-full flex items-center justify-center mx-auto border border-yellow-300">
            <NotePencil size={24} weight="bold" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-neutral-900">Belum ada catatan</h2>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Mulai tulis ide, notulensi rapat, atau dokumentasi penting Anda sekarang.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded transition-transform hover:-translate-y-0.5"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Catatan Pertama</span>
            </Link>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty Filter Results */
        <div className="text-center py-14 px-4 bg-white border border-neutral-200 rounded-lg space-y-3 shadow-xs">
          <div className="w-10 h-10 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center mx-auto border border-neutral-200">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-neutral-900">Catatan tidak ditemukan</h2>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold border border-neutral-300 rounded cursor-pointer transition-colors"
            >
              <ArrowCounterClockwise size={13} weight="bold" />
              <span>Hapus Semua Filter</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Minimalist Clean Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {filteredNotes.map((note) => {
            const folder = folders.find((f) => f.id === note.folderId);
            const folderInfo = note.folderId ? folderPathMap.get(note.folderId) : undefined;
            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between p-3.5 sm:p-4 bg-white hover:bg-neutral-50/70 border border-neutral-200 hover:border-neutral-400 rounded-lg shadow-xs hover:shadow-sm transition-all"
              >
                <div>
                  {/* Top Bar: Folder Tag & Status / Action Buttons */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {folderInfo ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 bg-neutral-100 rounded max-w-[160px]"
                        title={`Folder: ${folderInfo.path}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: folderInfo.color }}
                        />
                        <span className="truncate">{folderInfo.name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-neutral-400">
                        Tanpa Folder
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {note.isLocked && (
                        <span
                          title="Terkunci AES-256"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-neutral-900 text-yellow-400 rounded"
                        >
                          <Lock size={10} weight="fill" />
                        </span>
                      )}
                      {note.isShared && (
                        <span
                          title="Catatan Publik Aktif"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 rounded"
                        >
                          <ShareNetwork size={10} weight="bold" />
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
                            toast.success(`Catatan "${note.title || "Catatan"}" diekspor ke Markdown`);
                          }}
                          className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Ekspor ke Markdown"
                        >
                          <DownloadSimple size={14} weight="bold" />
                        </button>
                      )}
                      <DeleteConfirmButton
                        action={deleteNoteAction.bind(null, note.id)}
                        confirmTitle="Hapus Catatan"
                        confirmMessage={`Hapus catatan "${note.title || "Catatan tanpa judul"}" secara permanen?`}
                        successMessage="Catatan berhasil dihapus."
                        className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                        iconSize={14}
                      />
                    </div>
                  </div>

                  {/* Title & Preview Link */}
                  <Link href={`/notes/${note.id}`} className="block focus:outline-none">
                    <h2 className="font-bold text-sm sm:text-[15px] text-neutral-900 line-clamp-1 group-hover:text-black group-hover:underline decoration-2">
                      {note.title || "Catatan tanpa judul"}
                    </h2>

                    {note.isLocked ? (
                      <p className="mt-1.5 text-xs text-neutral-400 italic flex items-center gap-1 min-h-[2.5rem]">
                        <Lock size={12} weight="fill" className="text-neutral-400 shrink-0" />
                        <span>Konten terenkripsi dengan password</span>
                      </p>
                    ) : note.snippet ? (
                      <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {note.snippet}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-neutral-400 italic min-h-[2.5rem]">
                        Catatan masih kosong...
                      </p>
                    )}
                  </Link>
                </div>

                {/* Card Footer: Date & Direct Link */}
                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                  <span className="flex items-center gap-1">
                    <CalendarBlank size={12} weight="bold" />
                    {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/notes/${note.id}`}
                    className="inline-flex items-center gap-1 font-bold text-neutral-700 hover:text-black group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Buka</span>
                    <ArrowRight size={11} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Minimalist Clean List Rows */
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-xs divide-y divide-neutral-100">
          {filteredNotes.map((note) => {
            const folder = folders.find((f) => f.id === note.folderId);
            const folderInfo = note.folderId ? folderPathMap.get(note.folderId) : undefined;
            return (
              <div
                key={note.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-3 hover:bg-neutral-50/80 transition-colors gap-2 sm:gap-4"
              >
                {/* Note Info */}
                <Link
                  href={`/notes/${note.id}`}
                  className="min-w-0 flex-1 flex items-start gap-2.5 focus:outline-none"
                >
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                      note.isLocked
                        ? "bg-neutral-900 text-yellow-400"
                        : note.isShared
                        ? "bg-purple-100 text-purple-900"
                        : "bg-yellow-100 text-neutral-900"
                    }`}
                  >
                    {note.isLocked ? (
                      <Lock size={13} weight="fill" />
                    ) : note.isShared ? (
                      <ShareNetwork size={13} weight="bold" />
                    ) : (
                      <NotePencil size={13} weight="bold" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 truncate group-hover:underline decoration-2">
                        {note.title || "Catatan tanpa judul"}
                      </span>
                      {note.isLocked && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-neutral-900 text-yellow-400 rounded shrink-0">
                          Kunci
                        </span>
                      )}
                      {note.isShared && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-purple-100 text-purple-900 rounded shrink-0">
                          Publik
                        </span>
                      )}
                    </div>
                    {note.snippet ? (
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {note.snippet}
                      </p>
                    ) : null}
                  </div>
                </Link>

                {/* Meta & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-9 sm:pl-0">
                  {folderInfo ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 bg-neutral-100 rounded max-w-[130px]"
                      title={`Folder: ${folderInfo.path}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: folderInfo.color }}
                      />
                      <span className="truncate">{folderInfo.name}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      Tanpa Folder
                    </span>
                  )}

                  <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">
                    {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>

                  <div className="flex items-center gap-1">
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
                          toast.success(`Catatan "${note.title || "Catatan"}" diekspor ke Markdown`);
                        }}
                        className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                        title="Ekspor ke Markdown"
                      >
                        <DownloadSimple size={14} weight="bold" />
                      </button>
                    )}
                    <DeleteConfirmButton
                      action={deleteNoteAction.bind(null, note.id)}
                      confirmTitle="Hapus Catatan"
                      confirmMessage={`Hapus catatan "${note.title || "Catatan tanpa judul"}" secara permanen?`}
                      successMessage="Catatan berhasil dihapus."
                      className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                      iconSize={14}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
