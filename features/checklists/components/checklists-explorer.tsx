"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquareOffset,
  ListChecks,
  ArrowRight,
  Plus,
  MagnifyingGlass,
  X,
  CaretRight,
  CalendarBlank,
} from "@phosphor-icons/react";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { deleteChecklistAction } from "@/features/checklists/actions/checklist.action";
import { CreateChecklistForm } from "@/features/checklists/components/create-checklist-form";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { folderService, type FolderWithPath } from "@/features/folders/services/folder.service";
import type { Folder, Checklist } from "@/lib/db/schema";

interface ChecklistsExplorerProps {
  initialChecklists: Checklist[];
  folders: Folder[];
  initialFolderId?: string;
}

export function ChecklistsExplorer({
  initialChecklists,
  folders,
  initialFolderId,
}: ChecklistsExplorerProps) {
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

  // Folder counts for checklists
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let uncategorized = 0;
    for (const cl of initialChecklists) {
      if (!cl.folderId) {
        uncategorized++;
      } else {
        counts[cl.folderId] = (counts[cl.folderId] || 0) + 1;
      }
    }
    return { counts, uncategorized, total: initialChecklists.length };
  }, [initialChecklists]);

  // Selected folder breadcrumbs & direct subfolders
  const activeFolderBreadcrumbs = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "none") return [];
    return folderService.getFolderPath(selectedFolderId, folders);
  }, [selectedFolderId, folders]);

  const activeDirectSubfolders = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "none") return [];
    return folders.filter((f) => f.parentId === selectedFolderId);
  }, [selectedFolderId, folders]);

  // Filter checklists
  const filteredChecklists = useMemo(() => {
    let result = [...initialChecklists];

    // 1. Folder filter
    if (selectedFolderId === "none") {
      result = result.filter((cl) => !cl.folderId);
    } else if (selectedFolderId && selectedFolderId !== "all") {
      if (includeSubfolders) {
        const descendantIds = folderService.getDescendantFolderIds(selectedFolderId, folders);
        const targetIds = new Set([selectedFolderId, ...descendantIds]);
        result = result.filter((cl) => cl.folderId && targetIds.has(cl.folderId));
      } else {
        result = result.filter((cl) => cl.folderId === selectedFolderId);
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((cl) => cl.title.toLowerCase().includes(q));
    }

    return result;
  }, [initialChecklists, selectedFolderId, includeSubfolders, searchQuery, folders]);

  const isFilterActive = searchQuery.trim().length > 0 || selectedFolderId !== "all";

  return (
    <div className="space-y-6">
      {/* 1. Header & Create Checklist Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black">Checklist Harian</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Daftar periksa tugas sederhana dengan deadline, progress, dan folder bertingkat
          </p>
        </div>
      </div>

      <CreateChecklistForm
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
            placeholder="Cari daftar checklist berdasarkan judul..."
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
            <span>Semua Checklist</span>
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
                <span>Sertakan Checklist Subfolder</span>
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
            Menampilkan {filteredChecklists.length} dari {initialChecklists.length} checklist
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

      {/* 4. Checklists List */}
      {filteredChecklists.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-emerald-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-emerald-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <ListChecks size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">
            {searchQuery || selectedFolderId !== "all"
              ? "Tidak ada checklist yang cocok dengan filter."
              : "Belum ada daftar checklist."}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {searchQuery || selectedFolderId !== "all"
              ? "Coba sesuaikan kata kunci pencarian atau pilih folder lain."
              : "Buat grup checklist baru di atas untuk mulai mencatat to-do list harianmu."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredChecklists.map((cl) => {
            const folderInfo = cl.folderId ? folderPathMap.get(cl.folderId) : undefined;
            return (
              <li
                key={cl.id}
                className="group relative flex items-center justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all gap-4"
              >
                <Link href={`/checklists/${cl.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="p-2 bg-emerald-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-emerald-950 shrink-0">
                    <CheckSquareOffset size={20} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                        {cl.title}
                      </p>

                      {/* Folder Breadcrumbs Path Badge */}
                      {folderInfo ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 border border-black/30 rounded-xs shrink-0 max-w-full"
                          title={`Jalur: ${folderInfo.path}`}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-xs border border-black shrink-0"
                            style={{ backgroundColor: folderInfo.color }}
                          />
                          <span className="truncate max-w-[150px]">{folderInfo.path}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">
                          Tanpa Folder
                        </span>
                      )}

                      {cl.deadline && (
                        <div className="shrink-0">
                          <DeadlineBadge deadline={new Date(cl.deadline)} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarBlank size={12} weight="bold" />
                      <span>
                        Dibuat {new Date(cl.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/checklists/${cl.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Lihat Item</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>

                  <DeleteConfirmButton
                    action={deleteChecklistAction.bind(null, cl.id)}
                    confirmTitle="Hapus Checklist"
                    confirmMessage={`Hapus checklist "${cl.title}"? Semua item di dalamnya akan ikut terhapus.`}
                    successMessage="Checklist berhasil dihapus."
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                    iconSize={15}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
