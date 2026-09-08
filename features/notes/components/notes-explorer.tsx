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
  DownloadSimple,
  CalendarBlank,
  Globe,
  CaretRight,
  SlidersHorizontal,
  Funnel,
  ArrowsDownUp,
  FileArrowUp,
  FileArrowDown,
  Eye,
} from "@phosphor-icons/react";
import { FolderShareDialog } from "@/features/folders/components/folder-share-dialog";
import { NoteQuickPreviewModal } from "@/features/notes/components/note-quick-preview-modal";

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
  const [previewNote, setPreviewNote] = useState<EnrichedNote | null>(null);

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
          return (a.title || "").localeCompare(a.title || "", "id", { sensitivity: "base" });
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
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Header Section (Neobrutalism Design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-foreground">Catatan</h1>
            <span className="px-2 py-0.5 text-xs font-black bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {initialNotes.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
            Dokumentasi, ide, dan catatan terenkripsi dengan pencarian cepat
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-2 border-2 border-black dark:border-border font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer ${
                    sharedFolderMap[selectedFolderObj.id]
                      ? "bg-purple-300 hover:bg-purple-200 text-black"
                      : "bg-white dark:bg-card hover:bg-neutral-100 dark:hover:bg-muted text-black dark:text-foreground"
                  }`}
                  title="Bagikan folder aktif ke publik"
                >
                  <Globe size={16} weight="bold" />
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black bg-cyan-300 hover:bg-cyan-200 text-black font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer shrink-0"
                title="Impor catatan dari format Markdown (.md atau .zip)"
              >
                <FileArrowUp size={16} weight="bold" />
                <span className="hidden sm:inline">Import MD</span>
                <span className="sm:hidden">Import</span>
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black bg-lime-300 hover:bg-lime-200 text-black font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer shrink-0"
                title="Ekspor catatan ke format Markdown (.md atau .zip)"
              >
                <FileArrowDown size={16} weight="bold" />
                <span className="hidden sm:inline">Export MD</span>
                <span className="sm:hidden">Export</span>
              </button>
            }
          />

          <Link
            href="/notes/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-black bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer shrink-0 min-h-[38px]"
          >
            <Plus size={16} weight="bold" />
            <span>Tulis Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Control Toolbar (Neobrutalist Unified Bar) */}
      <div className="bg-white dark:bg-card border-2 border-black dark:border-border p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan... (Tekan '/' untuk mencari)"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-zinc-900 border-2 border-black dark:border-border font-medium text-black dark:text-foreground placeholder:text-neutral-500 dark:placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 dark:text-zinc-400 hover:text-black dark:hover:text-foreground hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Filter & View Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilterPanel((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black border-2 border-black dark:border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer ${
                showFilterPanel || secondaryFiltersCount > 0
                  ? "bg-yellow-400 text-black"
                  : "bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-800 dark:text-foreground"
              }`}
              title="Pengaturan Filter Status & Urutan"
            >
              <SlidersHorizontal size={15} weight="bold" />
              <span>Filter</span>
              {secondaryFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-black text-yellow-400 text-[10px] font-black rounded-xs">
                  {secondaryFiltersCount}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex border-2 border-black dark:border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-yellow-400 text-black"
                    : "bg-white dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-700"
                }`}
                title="Tampilan Grid (Kartu)"
                aria-label="Tampilan Grid"
              >
                <SquaresFour size={16} weight={viewMode === "grid" ? "fill" : "bold"} />
              </button>
              <div className="w-[2px] bg-black dark:bg-border" />
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-yellow-400 text-black"
                    : "bg-white dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-700"
                }`}
                title="Tampilan List (Daftar)"
                aria-label="Tampilan List"
              >
                <ListBullets size={16} weight={viewMode === "list" ? "fill" : "bold"} />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Secondary Filter Panel (Status & Sort) */}
        {showFilterPanel && (
          <div className="pt-3 border-t-2 border-black/10 dark:border-border grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-100">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as NoteStatusFilter)}
                className="w-full appearance-none pl-8 pr-7 py-2 text-xs font-bold bg-white dark:bg-zinc-900 border-2 border-black dark:border-border text-neutral-900 dark:text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:outline-none"
                aria-label="Filter status catatan"
              >
                <option value="all" className="dark:bg-zinc-900">Semua Status</option>
                <option value="locked" className="dark:bg-zinc-900">🔒 Terkunci Saja</option>
                <option value="shared" className="dark:bg-zinc-900">🌐 Publik Saja</option>
                <option value="normal" className="dark:bg-zinc-900">📝 Catatan Bebas</option>
              </select>
              <Funnel
                size={14}
                weight="bold"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-zinc-400 pointer-events-none"
              />
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
                className="w-full appearance-none pl-8 pr-7 py-2 text-xs font-bold bg-white dark:bg-zinc-900 border-2 border-black dark:border-border text-neutral-900 dark:text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:outline-none"
                aria-label="Urutkan catatan"
              >
                <option value="updated-desc" className="dark:bg-zinc-900">Terbaru Diperbarui</option>
                <option value="updated-asc" className="dark:bg-zinc-900">Terlama Diperbarui</option>
                <option value="created-desc" className="dark:bg-zinc-900">Terbaru Dibuat</option>
                <option value="created-asc" className="dark:bg-zinc-900">Terlama Dibuat</option>
                <option value="title-asc" className="dark:bg-zinc-900">Judul (A - Z)</option>
                <option value="title-desc" className="dark:bg-zinc-900">Judul (Z - A)</option>
              </select>
              <ArrowsDownUp
                size={14}
                weight="bold"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-zinc-400 pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Folder Filter Bar (Horizontal Neobrutalist Pills) */}
        <div className="pt-2 border-t-2 border-black/10 dark:border-border flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFolderId("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black dark:border-border font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
              selectedFolderId === "all"
                ? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
                : "bg-white dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-700"
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-xs text-[10px] font-black dark:text-zinc-200">
              {folderCounts.total}
            </span>
          </button>

          {folderCounts.uncategorized > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFolderId("none")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black dark:border-border font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                selectedFolderId === "none"
                  ? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-white dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-700"
              }`}
            >
              <span>Tanpa Folder</span>
              <span className="px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-xs text-[10px] font-black dark:text-zinc-200">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black dark:border-border font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-yellow-400 text-black translate-x-0.5 translate-y-0.5 shadow-none"
                    : "bg-white dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-700"
                }`}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-xs border border-black dark:border-zinc-700"
                  style={{ backgroundColor: f.color }}
                />
                <span className="truncate max-w-[140px]">{f.name}</span>
                {isFolderShared && (
                  <span title="Folder Publik Aktif" className="text-purple-900 dark:text-purple-300">
                    <Globe size={13} weight="bold" />
                  </span>
                )}
                <span className="px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-xs text-[10px] font-black dark:text-zinc-200">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Folder Breadcrumbs & Subfolder Navigation */}
        {/* Selected Folder Breadcrumbs & Subfolder Navigation */}
        {activeFolderBreadcrumbs.length > 0 && (
          <div className="pt-2 border-t-2 border-black/10 dark:border-border space-y-1.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400">Jalur Folder:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId("all")}
                  className="font-black text-black dark:text-foreground hover:underline cursor-pointer"
                >
                  Semua
                </button>
                {activeFolderBreadcrumbs.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1">
                    <CaretRight size={12} weight="bold" className="text-neutral-400 dark:text-zinc-500" />
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(crumb.id)}
                      className={`font-black hover:underline cursor-pointer flex items-center gap-1 ${
                        idx === activeFolderBreadcrumbs.length - 1
                          ? "text-yellow-700 dark:text-yellow-400 underline decoration-2"
                          : "text-neutral-700 dark:text-zinc-300"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-xs border border-black dark:border-zinc-700"
                        style={{ backgroundColor: crumb.color }}
                      />
                      <span>{crumb.name}</span>
                    </button>
                  </div>
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-black text-neutral-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={includeSubfolders}
                  onChange={(e) => setIncludeSubfolders(e.target.checked)}
                  className="accent-black cursor-pointer"
                />
                <span>Sertakan Catatan Subfolder</span>
              </label>
            </div>

            {/* Direct subfolder chips if any */}
            {activeDirectSubfolders.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 shrink-0">Subfolder:</span>
                {activeDirectSubfolders.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedFolderId(sub.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-neutral-100 dark:bg-zinc-800 hover:bg-yellow-200 dark:hover:bg-zinc-700 border-2 border-black dark:border-border rounded-xs font-bold text-black dark:text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer shrink-0"
                  >
                    <span
                      className="w-2 h-2 rounded-xs border border-black dark:border-zinc-700"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-neutral-600 dark:text-zinc-400 font-black">
                      ({folderCounts.counts[sub.id] || 0})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Active Filters Summary Bar */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-100 dark:bg-zinc-900 border-2 border-black dark:border-border text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-600 dark:text-zinc-300 font-bold">
              Menampilkan {filteredNotes.length} dari {initialNotes.length} catatan
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-0.5 border-2 border-black dark:border-border text-[11px] font-bold text-neutral-900 dark:text-zinc-200 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span>Cari: &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-neutral-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100 cursor-pointer ml-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}

            {selectedFolderId !== "all" && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-0.5 border-2 border-black dark:border-border text-[11px] font-bold text-neutral-900 dark:text-zinc-200 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span>
                  Folder:{" "}
                  {selectedFolderId === "none"
                    ? "Tanpa Folder"
                    : selectedFolderObj?.name || "Folder"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId("all")}
                  className="text-neutral-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100 cursor-pointer ml-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}

            {selectedStatus !== "all" && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-0.5 border-2 border-black dark:border-border text-[11px] font-bold text-neutral-900 dark:text-zinc-200 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
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
                  className="text-neutral-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100 cursor-pointer ml-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-rose-400 dark:hover:text-rose-300 underline font-black cursor-pointer shrink-0"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}

      {/* 4. Notes List View / Grid View */}
      {initialNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/40 dark:border-zinc-700 bg-yellow-50/60 dark:bg-card p-6 space-y-3">
          <div className="inline-flex p-3.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full text-black">
            <NotePencil size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black dark:text-foreground">Belum ada catatan.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Mulai tulis catatan pertamamu sekarang dengan rich-text editor bebas gangguan.
          </p>
          <div className="pt-2">
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Catatan Baru</span>
            </Link>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/40 dark:border-zinc-700 bg-neutral-50 dark:bg-card p-6 space-y-3">
          <div className="inline-flex p-3.5 bg-neutral-200 dark:bg-zinc-800 border-2 border-black dark:border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <MagnifyingGlass size={32} weight="bold" className="text-neutral-700 dark:text-zinc-300" />
          </div>
          <p className="text-base font-black text-black dark:text-foreground">Tidak ada catatan yang cocok.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan opsi filter folder dan status.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 border-2 border-black dark:border-border text-xs font-black text-neutral-900 dark:text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform cursor-pointer"
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
            const folderInfo = note.folderId ? folderPathMap.get(note.folderId) : undefined;
            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between h-full p-4 border-2 border-black dark:border-border bg-white dark:bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div>
                  {/* Top Bar: Folder badge on left, Status badges + Action Buttons on right */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    {folderInfo ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-zinc-200 bg-neutral-50 dark:bg-zinc-800/90 border border-black/30 dark:border-zinc-700 rounded-xs max-w-[170px]"
                        title={`Jalur Folder: ${folderInfo.path}`}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-xs border border-black dark:border-zinc-700 shrink-0"
                          style={{ backgroundColor: folderInfo.color }}
                        />
                        <span className="truncate">{folderInfo.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:text-zinc-400 uppercase bg-neutral-100 dark:bg-zinc-800/60 border border-dashed border-neutral-300 dark:border-zinc-700 rounded-xs">
                        Tanpa Folder
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {note.isLocked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          <Lock size={10} weight="fill" />
                          Kunci
                        </span>
                      )}
                      {note.isShared && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-purple-200 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-black dark:border-purple-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          <ShareNetwork size={10} weight="bold" />
                          Publik
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewNote(note);
                        }}
                        className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-yellow-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer"
                        title="Pratinjau Catatan & Diagram"
                      >
                        <Eye size={13} weight="bold" />
                      </button>
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
                          className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-lime-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer"
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
                        className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-rose-950/60 text-neutral-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-rose-300 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer disabled:opacity-50"
                        iconSize={13}
                      />
                    </div>
                  </div>

                  <Link href={`/notes/${note.id}`} className="block group/title">
                    <h2 className="font-bold text-base text-black dark:text-foreground truncate group-hover/title:underline decoration-2">
                      {note.title || "Catatan tanpa judul"}
                    </h2>
                  </Link>

                  {note.isLocked ? (
                    <div className="relative mt-2 p-2.5 bg-neutral-100 dark:bg-zinc-900 border border-black/10 dark:border-border overflow-hidden select-none min-h-[3rem] flex items-center justify-center">
                      <p className="text-xs text-neutral-600 dark:text-zinc-500 line-clamp-2 leading-relaxed filter blur-[4px] select-none pointer-events-none opacity-40 absolute inset-2">
                        {note.snippet ||
                          "Konten catatan ini terenkripsi aman dengan AES-256-GCM. Buka catatan dan masukkan password untuk membaca isinya."}
                      </p>
                      <span className="relative z-10 inline-flex items-center gap-1 text-[10px] font-black uppercase text-neutral-900 bg-yellow-300 px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Lock size={10} weight="fill" />
                        Deskripsi Terkunci
                      </span>
                    </div>
                  ) : note.snippet ? (
                    <p className="mt-1.5 text-xs text-neutral-600 dark:text-zinc-300 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {note.snippet}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-400 dark:text-zinc-400 italic min-h-[2.5rem]">
                      Catatan masih kosong...
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2.5 border-t border-black/10 dark:border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1 font-semibold">
                    <CalendarBlank size={12} weight="bold" />
                    {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/notes/${note.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-black text-xs font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
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
        /* List Mode View (Structured Neobrutalist Table Rows) */
        <div className="border-2 border-black dark:border-border bg-white dark:bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-yellow-300 dark:bg-zinc-800 border-b-2 border-black dark:border-border text-[11px] font-black text-black dark:text-foreground uppercase tracking-wider items-center">
            <div className="col-span-6">Catatan & Ringkasan</div>
            <div className="col-span-2">Folder</div>
            <div className="col-span-2">Diperbarui</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          <ul className="divide-y-2 divide-black/10 dark:divide-border">
            {filteredNotes.map((note) => {
              const folder = folders.find((f) => f.id === note.folderId);
              const folderInfo = note.folderId ? folderPathMap.get(note.folderId) : undefined;
              return (
                <li
                  key={note.id}
                  className="group hover:bg-yellow-50/70 dark:hover:bg-zinc-900/60 transition-colors"
                >
                  {/* Desktop / Tablet Row (md+) */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center px-4 py-3">
                    {/* Col 1: Note Title, Status Icons & Snippet */}
                    <div className="col-span-6 min-w-0 flex items-center gap-3">
                      <Link
                        href={`/notes/${note.id}`}
                        className={`w-9 h-9 border-2 border-black dark:border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                          note.isLocked
                            ? "bg-neutral-900 text-yellow-400"
                            : note.isShared
                            ? "bg-purple-200 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200"
                            : "bg-yellow-300 dark:bg-yellow-400 text-neutral-900 dark:text-black"
                        }`}
                        title={
                          note.isLocked
                            ? "Catatan Terkunci"
                            : note.isShared
                            ? "Catatan Publik"
                            : "Catatan"
                        }
                      >
                        {note.isLocked ? (
                          <Lock size={16} weight="fill" />
                        ) : note.isShared ? (
                          <ShareNetwork size={16} weight="bold" />
                        ) : (
                          <NotePencil size={16} weight="bold" />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/notes/${note.id}`}
                            className="font-bold text-sm text-black dark:text-foreground truncate hover:underline decoration-2"
                          >
                            {note.title || "Catatan tanpa judul"}
                          </Link>
                          {note.isLocked && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                              Kunci
                            </span>
                          )}
                          {note.isShared && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-purple-200 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-black dark:border-purple-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                              Publik
                            </span>
                          )}
                        </div>

                        {note.isLocked ? (
                          <p className="text-xs text-neutral-500 dark:text-zinc-400 italic truncate mt-0.5 flex items-center gap-1">
                            <Lock size={10} weight="fill" className="text-neutral-500 dark:text-zinc-400 inline" />
                            Konten terenkripsi (masukkan password untuk melihat)
                          </p>
                        ) : note.snippet ? (
                          <p className="text-xs text-neutral-600 dark:text-zinc-300 truncate mt-0.5">
                            {note.snippet}
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-400 dark:text-zinc-400 italic mt-0.5">
                            Catatan kosong...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Col 2: Folder */}
                    <div className="col-span-2 min-w-0">
                      {folderInfo ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-neutral-800 dark:text-zinc-200 bg-neutral-50 dark:bg-zinc-800/90 border border-black/30 dark:border-zinc-700 rounded-xs max-w-full"
                          title={`Jalur Folder: ${folderInfo.path}`}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-xs border border-black dark:border-zinc-700 shrink-0"
                            style={{ backgroundColor: folderInfo.color }}
                          />
                          <span className="truncate max-w-[140px]">{folderInfo.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:text-zinc-400 uppercase bg-neutral-100 dark:bg-zinc-800/60 border border-dashed border-neutral-300 dark:border-zinc-700 rounded-xs">
                          Tanpa Folder
                        </span>
                      )}
                    </div>

                    {/* Col 3: Last Updated */}
                    <div className="col-span-2 text-xs font-semibold text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <CalendarBlank size={13} weight="bold" className="text-neutral-500 dark:text-zinc-400" />
                      <span>
                        {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Col 4: Actions Toolbar */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewNote(note);
                        }}
                        className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-yellow-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer"
                        title="Pratinjau Catatan & Diagram"
                      >
                        <Eye size={13} weight="bold" />
                      </button>

                      <Link
                        href={`/notes/${note.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                        title="Buka Catatan"
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
                          className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-lime-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer"
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
                        className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-rose-950/60 text-neutral-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-rose-300 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer disabled:opacity-50"
                        iconSize={13}
                      />
                    </div>
                  </div>

                  {/* Mobile Row (<md) */}
                  <div className="md:hidden flex flex-col p-3.5 space-y-2.5">
                    {/* Top: Icon + Title & Badges + Date */}
                    <div className="flex items-start gap-2.5">
                      <Link
                        href={`/notes/${note.id}`}
                        className={`w-9 h-9 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0 flex items-center justify-center ${
                          note.isLocked
                            ? "bg-neutral-900 text-yellow-400"
                            : note.isShared
                            ? "bg-purple-200 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200"
                            : "bg-yellow-300 dark:bg-yellow-400 text-neutral-900 dark:text-black"
                        }`}
                      >
                        {note.isLocked ? (
                          <Lock size={16} weight="fill" />
                        ) : note.isShared ? (
                          <ShareNetwork size={16} weight="bold" />
                        ) : (
                          <NotePencil size={16} weight="bold" />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/notes/${note.id}`}
                            className="font-bold text-sm text-black dark:text-foreground truncate hover:underline decoration-2"
                          >
                            {note.title || "Catatan tanpa judul"}
                          </Link>
                          {note.isLocked && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                              Kunci
                            </span>
                          )}
                          {note.isShared && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-purple-200 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-black dark:border-purple-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                              Publik
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                          <CalendarBlank size={11} weight="bold" />
                          <span>
                            {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Snippet on mobile */}
                    {note.isLocked ? (
                      <p className="text-xs text-neutral-500 dark:text-zinc-400 italic flex items-center gap-1">
                        <Lock size={10} weight="fill" className="text-neutral-500 dark:text-zinc-400 shrink-0" />
                        Konten terenkripsi (masukkan password untuk melihat)
                      </p>
                    ) : note.snippet ? (
                      <p className="text-xs text-neutral-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                        {note.snippet}
                      </p>
                    ) : null}

                    {/* Bottom Row on mobile: Folder on the far left, Action buttons on the far right */}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 dark:border-border gap-2">
                      {/* Left: Folder */}
                      <div className="min-w-0 flex items-center">
                        {folderInfo ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-neutral-800 dark:text-zinc-200 bg-neutral-50 dark:bg-zinc-800/90 border border-black/30 dark:border-zinc-700 rounded-xs max-w-full"
                            title={`Jalur Folder: ${folderInfo.path}`}
                          >
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-xs border border-black dark:border-zinc-700 shrink-0"
                              style={{ backgroundColor: folderInfo.color }}
                            />
                            <span className="truncate max-w-[120px]">{folderInfo.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:text-zinc-400 uppercase bg-neutral-100 dark:bg-zinc-800/60 border border-dashed border-neutral-300 dark:border-zinc-700 rounded-xs">
                            Tanpa Folder
                          </span>
                        )}
                      </div>

                      {/* Right: Actions (Buka, Export, Delete) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewNote(note);
                          }}
                          className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-yellow-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer"
                          title="Pratinjau Catatan & Diagram"
                        >
                          <Eye size={13} weight="bold" />
                        </button>

                        <Link
                          href={`/notes/${note.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                          title="Buka Catatan"
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
                            className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-lime-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer"
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
                          className="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-rose-950/60 text-neutral-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-rose-300 border-2 border-black dark:border-border shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all rounded-xs cursor-pointer disabled:opacity-50"
                          iconSize={13}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Modal Pratinjau Cepat Catatan & Diagram Mermaid */}
      <NoteQuickPreviewModal
        note={previewNote}
        folder={folders.find((f) => f.id === previewNote?.folderId)}
        isOpen={!!previewNote}
        onClose={() => setPreviewNote(null)}
      />
    </div>
  );
}
