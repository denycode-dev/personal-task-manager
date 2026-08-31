"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Kanban,
  Layout,
  ArrowRight,
  Plus,
  MagnifyingGlass,
  X,
  CaretRight,
  FolderSimple,
  CalendarBlank,
} from "@phosphor-icons/react";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { deleteBoardAction } from "@/features/kanban/actions/board.action";
import { CreateBoardForm } from "@/features/kanban/components/create-board-form";
import { folderService, type FolderWithPath } from "@/features/folders/services/folder.service";
import type { Folder, KanbanBoard } from "@/lib/db/schema";

interface KanbanExplorerProps {
  initialBoards: KanbanBoard[];
  folders: Folder[];
  initialFolderId?: string;
}

export function KanbanExplorer({
  initialBoards,
  folders,
  initialFolderId,
}: KanbanExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolderId || "all");
  const [includeSubfolders, setIncludeSubfolders] = useState(true);

  // Compute folder hierarchy & paths
  const hierarchicalFolders: FolderWithPath[] = useMemo(() => {
    return folderService.getFolderHierarchy(folders);
  }, [folders]);

  const folderPathMap = useMemo(() => {
    const map = new Map<string, { path: string; color: string; name: string }>();
    for (const h of hierarchicalFolders) {
      map.set(h.id, { path: h.path, color: h.color, name: h.name });
    }
    return map;
  }, [hierarchicalFolders]);

  // Folder counts for boards
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let uncategorized = 0;
    for (const board of initialBoards) {
      if (!board.folderId) {
        uncategorized++;
      } else {
        counts[board.folderId] = (counts[board.folderId] || 0) + 1;
      }
    }
    return { counts, uncategorized, total: initialBoards.length };
  }, [initialBoards]);

  // Selected folder breadcrumbs & direct subfolders
  const activeFolderBreadcrumbs = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "none") return [];
    return folderService.getFolderPath(selectedFolderId, folders);
  }, [selectedFolderId, folders]);

  const activeDirectSubfolders = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "none") return [];
    return folders.filter((f) => f.parentId === selectedFolderId);
  }, [selectedFolderId, folders]);

  // Filter boards
  const filteredBoards = useMemo(() => {
    let result = [...initialBoards];

    // 1. Folder filter
    if (selectedFolderId === "none") {
      result = result.filter((b) => !b.folderId);
    } else if (selectedFolderId && selectedFolderId !== "all") {
      if (includeSubfolders) {
        const descendantIds = folderService.getDescendantFolderIds(selectedFolderId, folders);
        const targetIds = new Set([selectedFolderId, ...descendantIds]);
        result = result.filter((b) => b.folderId && targetIds.has(b.folderId));
      } else {
        result = result.filter((b) => b.folderId === selectedFolderId);
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }

    return result;
  }, [initialBoards, selectedFolderId, includeSubfolders, searchQuery, folders]);

  const isFilterActive = searchQuery.trim().length > 0 || selectedFolderId !== "all";

  return (
    <div className="space-y-6">
      {/* 1. Header & Create Board Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black">Papan Kanban</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Kelola alur kerja tugas dengan drag-and-drop antar kolom dan folder bertingkat
          </p>
        </div>
      </div>

      <CreateBoardForm
        folders={folders}
        defaultFolderId={selectedFolderId !== "all" && selectedFolderId !== "none" ? selectedFolderId : undefined}
      />

      {/* 2. Search & Multi-Level Folder Filter Bar */}
      <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari papan kanban berdasarkan judul..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-neutral-50 border-2 border-black font-medium text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-black cursor-pointer"
              title="Hapus pencarian"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Horizontal Folder Pills */}
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
            <span>Semua Papan</span>
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

          {hierarchicalFolders.map((f) => {
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
                {f.depth > 0 && (
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {"└".padStart(f.depth, "·")}
                  </span>
                )}
                <span className="truncate max-w-[140px]">{f.name}</span>
                <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Breadcrumb Trail & Subfolders Chips */}
        {activeFolderBreadcrumbs.length > 0 && (
          <div className="pt-2 border-t border-black/10 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-neutral-500">Jalur Folder:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId("all")}
                  className="font-bold text-black hover:underline cursor-pointer"
                >
                  Semua
                </button>
                {activeFolderBreadcrumbs.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1">
                    <CaretRight size={12} weight="bold" className="text-neutral-400" />
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(crumb.id)}
                      className={`font-bold hover:underline cursor-pointer flex items-center gap-1 ${
                        idx === activeFolderBreadcrumbs.length - 1
                          ? "text-yellow-700 font-black"
                          : "text-neutral-700"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-xs border border-black"
                        style={{ backgroundColor: crumb.color }}
                      />
                      <span>{crumb.name}</span>
                    </button>
                  </div>
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeSubfolders}
                  onChange={(e) => setIncludeSubfolders(e.target.checked)}
                  className="accent-black cursor-pointer"
                />
                <span>Sertakan Papan Subfolder</span>
              </label>
            </div>

            {/* Direct Subfolder chips */}
            {activeDirectSubfolders.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[11px] font-bold text-neutral-500 shrink-0">Subfolder:</span>
                {activeDirectSubfolders.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedFolderId(sub.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-neutral-100 hover:bg-yellow-200 border border-black/40 rounded-xs font-bold text-black transition-colors cursor-pointer shrink-0"
                  >
                    <span
                      className="w-2 h-2 rounded-xs border border-black"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-neutral-500">
                      ({folderCounts.counts[sub.id] || 0})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Active Filters Summary */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-100 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-muted-foreground">
            Menampilkan {filteredBoards.length} dari {initialBoards.length} papan kanban
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedFolderId("all");
            }}
            className="text-red-600 hover:text-red-700 underline font-bold cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* 4. Kanban Boards Grid */}
      {filteredBoards.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-blue-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-blue-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <Layout size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">
            {searchQuery || selectedFolderId !== "all"
              ? "Tidak ada papan kanban yang sesuai filter."
              : "Belum ada papan kanban."}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {searchQuery || selectedFolderId !== "all"
              ? "Coba sesuaikan kata kunci pencarian atau pilih folder lain."
              : "Buat papan kanban pertamamu di atas untuk mulai mengatur alur tugas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoards.map((board) => {
            const folderInfo = board.folderId ? folderPathMap.get(board.folderId) : undefined;
            return (
              <div
                key={board.id}
                className="group relative flex flex-col justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/kanban/${board.id}`} className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="p-1.5 bg-blue-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-blue-900 shrink-0">
                        <Kanban size={18} weight="bold" />
                      </span>
                      <h2 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                        {board.title}
                      </h2>
                    </Link>

                    <DeleteConfirmButton
                      action={deleteBoardAction.bind(null, board.id)}
                      confirmTitle="Hapus Papan Kanban"
                      confirmMessage={`Hapus papan kanban "${board.title}"? Semua kolom dan kartu di dalamnya akan ikut terhapus.`}
                      successMessage="Papan kanban berhasil dihapus."
                      className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer shrink-0"
                      iconSize={14}
                    />
                  </div>

                  {/* Folder Hierarchy Path Badge */}
                  {folderInfo ? (
                    <div
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 bg-neutral-50 px-2 py-0.5 border border-black/30 rounded-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)] max-w-full"
                      title={`Jalur: ${folderInfo.path}`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-xs border border-black shrink-0"
                        style={{ backgroundColor: folderInfo.color }}
                      />
                      <span className="truncate">{folderInfo.path}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Tanpa Folder
                    </span>
                  )}
                </div>

                <div className="pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <CalendarBlank size={12} weight="bold" />
                    {new Date(board.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/kanban/${board.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 border border-black text-black text-xs font-bold shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                  >
                    <span>Buka Papan</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
