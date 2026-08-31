"use client";

import { useState, useTransition, useMemo } from "react";
import {
  createFolderAction,
  updateFolderAction,
  deleteFolderAction,
  moveFolderAction,
} from "@/features/folders/actions/folder.action";
import { toast } from "sonner";
import { useConfirm } from "@/lib/hooks/use-confirm";
import Link from "next/link";
import {
  Trash,
  Plus,
  Folder as FolderIcon,
  FolderPlus,
  FolderOpen,
  PencilSimple,
  X,
  Note,
  Kanban,
  CheckSquareOffset,
  CircleNotch,
  Globe,
  ShareNetwork,
  CaretRight,
  CaretDown,
  House,
  TreeStructure,
  SquaresFour,
  MagnifyingGlass,
  ArrowBendDownRight,
  ArrowUUpLeft,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { FolderShareDialog } from "@/features/folders/components/folder-share-dialog";
import { FolderSelect } from "@/features/folders/components/folder-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Folder as FolderType } from "@/lib/db/schema";
import { folderService, type FolderWithCounts, type FolderTreeNode } from "@/features/folders/services/folder.service";

// 12 neobrutalism preset colors
const PRESET_COLORS = [
  { value: "#FFD500", label: "Yellow" },
  { value: "#FF6B6B", label: "Coral" },
  { value: "#FF9F1C", label: "Orange" },
  { value: "#F72585", label: "Hot Pink" },
  { value: "#7209B7", label: "Purple" },
  { value: "#4361EE", label: "Blue" },
  { value: "#4CC9F0", label: "Sky" },
  { value: "#06D6A0", label: "Emerald" },
  { value: "#80B918", label: "Lime" },
  { value: "#2D6A4F", label: "Forest" },
  { value: "#8D99AE", label: "Steel" },
  { value: "#1A1A2E", label: "Navy" },
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          suppressHydrationWarning
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          style={{ backgroundColor: c.value }}
          className={`w-6 h-6 border-2 transition-transform cursor-pointer ${
            value === c.value
              ? "border-black scale-125 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              : "border-transparent hover:border-black"
          }`}
        />
      ))}
    </div>
  );
}

export function FolderList({
  initialFolders,
  sharedFolderMap = {},
}: {
  initialFolders: (FolderType | FolderWithCounts)[];
  sharedFolderMap?: Record<string, string>;
}) {
  const [folders, setFolders] = useState<(FolderType | FolderWithCounts)[]>(initialFolders);

  // View state: 'explorer' (directory with breadcrumbs) vs 'tree' (full hierarchy tree)
  const [viewMode, setViewMode] = useState<"explorer" | "tree">("explorer");
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal / form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState(PRESET_COLORS[0].value);
  const [createParentId, setCreateParentId] = useState<string>("");

  // Edit modal state
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editParentId, setEditParentId] = useState<string>("");

  // Quick Move modal state
  const [movingFolder, setMovingFolder] = useState<FolderType | null>(null);
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>("");

  // Expanded nodes for Tree View
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  // Compute folder counts & hierarchy
  const enrichedFolders: FolderWithCounts[] = useMemo(() => {
    const subfolderMap = new Map<string, number>();
    for (const f of folders) {
      if (f.parentId) {
        subfolderMap.set(f.parentId, (subfolderMap.get(f.parentId) ?? 0) + 1);
      }
    }

    return folders.map((f) => ({
      ...f,
      notesCount: (f as Partial<FolderWithCounts>).notesCount ?? 0,
      boardsCount: (f as Partial<FolderWithCounts>).boardsCount ?? 0,
      checklistsCount: (f as Partial<FolderWithCounts>).checklistsCount ?? 0,
      subfoldersCount: subfolderMap.get(f.id) ?? 0,
    }));
  }, [folders]);

  // Tree nodes representation
  const treeNodes = useMemo(() => {
    return folderService.buildFolderTree(enrichedFolders);
  }, [enrichedFolders]);

  // Breadcrumbs for Explorer view
  const breadcrumbs = useMemo(() => {
    if (!currentParentId) return [];
    return folderService.getFolderPath(currentParentId, folders);
  }, [currentParentId, folders]);

  // Current folder object (if inside a subfolder level)
  const currentFolder = useMemo(() => {
    if (!currentParentId) return null;
    return folders.find((f) => f.id === currentParentId) ?? null;
  }, [currentParentId, folders]);

  // Folders at current explorer level
  const currentExplorerFolders = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return enrichedFolders.filter((f) => f.name.toLowerCase().includes(q));
    }
    return enrichedFolders.filter((f) => (currentParentId ? f.parentId === currentParentId : !f.parentId));
  }, [enrichedFolders, currentParentId, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const rootCount = folders.filter((f) => !f.parentId).length;
    const subfolderCount = folders.filter((f) => Boolean(f.parentId)).length;
    const sharedCount = Object.keys(sharedFolderMap).length;
    return { rootCount, subfolderCount, sharedCount, total: folders.length };
  }, [folders, sharedFolderMap]);

  // Handle Quick + Subfolder
  const handleOpenCreateSubfolder = (parentId: string) => {
    setCreateParentId(parentId);
    setCreateName("");
    setCreateColor(PRESET_COLORS[0].value);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateRoot = () => {
    setCreateParentId(currentParentId || "");
    setCreateName("");
    setCreateColor(PRESET_COLORS[0].value);
    setIsCreateModalOpen(true);
  };

  const handleCreate = () => {
    if (!createName.trim()) return;
    startTransition(async () => {
      const result = await createFolderAction({
        name: createName.trim(),
        color: createColor,
        parentId: createParentId || null,
      });
      if (result.success) {
        setFolders((prev) => [
          ...prev,
          {
            ...result.data,
            notesCount: 0,
            boardsCount: 0,
            checklistsCount: 0,
            subfoldersCount: 0,
          },
        ]);
        setCreateName("");
        setIsCreateModalOpen(false);
        toast.success("Folder berhasil dibuat.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleOpenEdit = (folder: FolderType) => {
    setEditingFolder(folder);
    setEditName(folder.name);
    setEditColor(folder.color);
    setEditParentId(folder.parentId ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editingFolder || !editName.trim()) return;

    const ok = await confirm({
      title: "Simpan Perubahan Folder",
      message: `Simpan perubahan pada folder "${editingFolder.name}"?`,
      confirmLabel: "Simpan",
      danger: false,
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await updateFolderAction(editingFolder.id, {
        name: editName.trim(),
        color: editColor,
        parentId: editParentId || null,
      });
      if (result.success) {
        setFolders((prev) =>
          prev.map((f) => (f.id === editingFolder.id ? { ...f, ...result.data } : f))
        );
        setEditingFolder(null);
        toast.success("Folder berhasil diperbarui.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleOpenMove = (folder: FolderType) => {
    setMovingFolder(folder);
    setMoveTargetParentId(folder.parentId ?? "");
  };

  const handleSaveMove = async () => {
    if (!movingFolder) return;
    startTransition(async () => {
      const result = await moveFolderAction(movingFolder.id, moveTargetParentId || null);
      if (result.success) {
        setFolders((prev) =>
          prev.map((f) => (f.id === movingFolder.id ? { ...f, ...result.data } : f))
        );
        setMovingFolder(null);
        toast.success(`Folder "${movingFolder.name}" berhasil dipindahkan.`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = async (id: string, folderName: string) => {
    const descendantIds = folderService.getDescendantFolderIds(id, folders);
    const subfolderWarning =
      descendantIds.length > 0
        ? ` Folder ini memiliki ${descendantIds.length} subfolder yang juga akan ikut terhapus.`
        : "";

    const ok = await confirm({
      title: "Hapus Folder",
      message: `Hapus folder "${folderName}"?${subfolderWarning} Catatan, papan kanban, dan checklist di dalamnya tidak akan terhapus, melainkan dikeluarkan dari folder (ungrouped).`,
      confirmLabel: "Hapus Folder",
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteFolderAction(id);
      if (result.success) {
        const idsToRemove = new Set([id, ...descendantIds]);
        setFolders((prev) => prev.filter((f) => !idsToRemove.has(f.id)));
        if (currentParentId && idsToRemove.has(currentParentId)) {
          setCurrentParentId(null);
        }
        toast.success("Folder berhasil dihapus.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Disabled IDs in Edit / Move Parent Dropdown: cannot select self or descendants to prevent cycles!
  const moveDisabledFolderIds = useMemo(() => {
    const activeTarget = movingFolder || editingFolder;
    if (!activeTarget) return [];
    const descendants = folderService.getDescendantFolderIds(activeTarget.id, folders);
    return [activeTarget.id, ...descendants];
  }, [movingFolder, editingFolder, folders]);

  // Render a Single Tree Node recursively
  const renderTreeNode = (node: FolderTreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isFolderShared = Boolean(sharedFolderMap[node.id]);

    return (
      <div key={node.id} className="space-y-1">
        <div
          className="flex items-center justify-between p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-50/50 transition-all gap-2"
          style={{ marginLeft: `${node.depth * 1.5}rem` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNodeExpanded(node.id)}
                className="p-1 hover:bg-neutral-200 border border-black rounded-xs transition-colors shrink-0 cursor-pointer"
                title={isExpanded ? "Ciutkan subfolder" : "Perluas subfolder"}
              >
                {isExpanded ? (
                  <CaretDown size={14} weight="bold" />
                ) : (
                  <CaretRight size={14} weight="bold" />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0 flex items-center justify-center text-neutral-400">
                <ArrowBendDownRight size={14} weight="bold" />
              </span>
            )}

            <span
              className="w-3.5 h-3.5 flex-shrink-0 border border-black rounded-xs"
              style={{ backgroundColor: node.color }}
            />

            <button
              type="button"
              onClick={() => {
                setCurrentParentId(node.id);
                setViewMode("explorer");
              }}
              className="font-black text-xs sm:text-sm text-black hover:underline decoration-2 truncate text-left cursor-pointer"
              title="Buka di tampilan direktori"
            >
              {node.name}
            </button>

            {node.depth > 0 && (
              <span className="px-1.5 py-0.2 bg-neutral-100 border border-black/20 text-[10px] font-bold text-neutral-600 rounded-xs shrink-0">
                Lv.{node.depth + 1}
              </span>
            )}

            {hasChildren && (
              <span className="px-1.5 py-0.2 bg-yellow-200 border border-black/30 text-[10px] font-black rounded-xs shrink-0">
                {node.children.length} subfolder
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenCreateSubfolder(node.id)}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-300 hover:bg-yellow-400 border border-black text-[11px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              title="Tambah subfolder di dalam folder ini"
            >
              <Plus size={12} weight="bold" />
              <span className="hidden sm:inline">Subfolder</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMove(node)}
              disabled={isPending}
              className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer"
              title="Pindah lokasi folder (Move)"
            >
              <ArrowsLeftRight size={14} weight="bold" />
            </button>

            <FolderShareDialog
              folderId={node.id}
              folderName={node.name}
              folderColor={node.color}
              initialIsShared={isFolderShared}
              initialSlug={sharedFolderMap[node.id] ?? null}
              notesCount={node.notesCount}
              triggerButton={
                <button
                  type="button"
                  disabled={isPending}
                  className={`p-1 border rounded-xs transition-colors cursor-pointer ${
                    isFolderShared
                      ? "bg-purple-200 text-purple-900 border-black hover:bg-purple-300"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-100 border-transparent hover:border-black"
                  }`}
                  title={isFolderShared ? "Folder Publik Aktif" : "Bagikan folder ke publik"}
                >
                  {isFolderShared ? <Globe size={14} weight="bold" /> : <ShareNetwork size={14} weight="bold" />}
                </button>
              }
            />

            <button
              type="button"
              onClick={() => handleOpenEdit(node)}
              disabled={isPending}
              className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Edit folder"
            >
              <PencilSimple size={14} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(node.id, node.name)}
              disabled={isPending}
              className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus folder"
            >
              <Trash size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Children render */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 pl-2 border-l-2 border-dashed border-black/20 my-1">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 0. Folder Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-yellow-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-neutral-700 block">Total Folder</span>
          <span className="text-xl font-black text-black">{stats.total}</span>
        </div>
        <div className="p-3 bg-sky-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-neutral-700 block">Folder Utama (Root)</span>
          <span className="text-xl font-black text-black">{stats.rootCount}</span>
        </div>
        <div className="p-3 bg-emerald-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-neutral-700 block">Subfolder (Bertingkat)</span>
          <span className="text-xl font-black text-black">{stats.subfolderCount}</span>
        </div>
        <div className="p-3 bg-purple-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-neutral-700 block">Folder Publik</span>
          <span className="text-xl font-black text-black">{stats.sharedCount}</span>
        </div>
      </div>

      {/* 1. Top Control Bar: View Switch, Search & Create Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama folder di semua tingkat..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-50 border-2 border-black font-medium focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black"
                title="Hapus filter pencarian"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("explorer")}
              className={`px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "explorer"
                  ? "bg-yellow-400 text-black"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
              title="Tampilan Direktori / Explorer"
            >
              <SquaresFour size={16} weight={viewMode === "explorer" ? "fill" : "bold"} />
              <span className="hidden md:inline">Direktori</span>
            </button>
            <div className="w-[2px] bg-black" />
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "tree"
                  ? "bg-yellow-400 text-black"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
              title="Tampilan Pohon Hierarki (Tree View)"
            >
              <TreeStructure size={16} weight={viewMode === "tree" ? "fill" : "bold"} />
              <span className="hidden md:inline">Pohon (Tree)</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateRoot}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer min-w-[130px]"
        >
          <FolderPlus size={16} weight="bold" />
          <span>+ Buat Folder</span>
        </button>
      </div>

      {/* 2. Breadcrumbs Bar (In Explorer Mode) */}
      {viewMode === "explorer" && (
        <div className="flex items-center justify-between gap-2 p-2.5 bg-neutral-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-bold">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setCurrentParentId(null)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xs border transition-all cursor-pointer ${
                currentParentId === null
                  ? "bg-yellow-400 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black"
                  : "bg-white border-transparent hover:border-black text-neutral-700 hover:text-black"
              }`}
            >
              <House size={14} weight="bold" />
              <span>Root</span>
            </button>

            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.id} className="flex items-center gap-1.5">
                  <CaretRight size={12} weight="bold" className="text-neutral-400" />
                  <button
                    type="button"
                    onClick={() => setCurrentParentId(crumb.id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xs border transition-all cursor-pointer ${
                      isLast
                        ? "bg-yellow-400 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black"
                        : "bg-white border-transparent hover:border-black text-neutral-700 hover:text-black"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 border border-black rounded-xs shrink-0"
                      style={{ backgroundColor: crumb.color }}
                    />
                    <span className="truncate max-w-[150px]">{crumb.name}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {currentParentId && currentFolder && (
            <button
              type="button"
              onClick={() => setCurrentParentId(currentFolder.parentId || null)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-neutral-200 border border-black text-[11px] font-bold transition-colors cursor-pointer shrink-0"
              title="Naik satu tingkat ke folder induk"
            >
              <ArrowUUpLeft size={13} weight="bold" />
              <span className="hidden sm:inline">Naik 1 Level</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Main Content View */}
      {folders.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-black/30 bg-purple-50/50 space-y-3">
          <FolderOpen size={36} weight="bold" className="mx-auto text-neutral-500" />
          <p className="text-sm font-bold text-black">Belum ada folder kustom.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Buat folder bertingkat untuk merapikan catatan, papan kanban, dan checklist harianmu.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateRoot}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>Buat Folder Pertama</span>
          </button>
        </div>
      ) : viewMode === "tree" ? (
        /* Tree Hierarchy View */
        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <TreeStructure size={18} weight="bold" />
              <h2 className="font-black text-sm text-black">Struktur Pohon Folder</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set(folders.map((f) => f.id)))}
                className="text-[11px] font-bold text-neutral-700 hover:text-black underline cursor-pointer"
              >
                Buka Semua
              </button>
              <span className="text-neutral-400">|</span>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set())}
                className="text-[11px] font-bold text-neutral-700 hover:text-black underline cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {treeNodes.map((node) => renderTreeNode(node))}
          </div>
        </div>
      ) : (
        /* Explorer / Grid View */
        <div className="space-y-4">
          {currentExplorerFolders.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-black/30 bg-neutral-50 space-y-2">
              <FolderOpen size={30} weight="bold" className="mx-auto text-neutral-400" />
              <p className="text-xs font-bold text-neutral-700">
                {searchQuery
                  ? "Tidak ada folder yang cocok dengan kata kunci."
                  : "Tidak ada subfolder di dalam folder ini."}
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateSubfolder(currentParentId || "")}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <Plus size={14} weight="bold" />
                <span>+ Buat Subfolder di Sini</span>
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentExplorerFolders.map((folder) => {
                const isFolderShared = Boolean(sharedFolderMap[folder.id]);
                return (
                  <li
                    key={folder.id}
                    className="flex flex-col justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={() => {
                          if (folder.subfoldersCount > 0) {
                            setCurrentParentId(folder.id);
                          }
                        }}
                        className={`flex items-center gap-2 min-w-0 flex-1 ${
                          folder.subfoldersCount > 0 ? "cursor-pointer group" : ""
                        }`}
                      >
                        <span
                          className="w-4 h-4 flex-shrink-0 border-2 border-black rounded-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          style={{ backgroundColor: folder.color }}
                        />
                        <FolderIcon size={20} weight="fill" className="text-neutral-700 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-black text-sm text-black truncate block group-hover:underline decoration-2">
                            {folder.name}
                          </span>
                          {folder.subfoldersCount > 0 && (
                            <span className="text-[10px] font-bold text-neutral-500">
                              📁 {folder.subfoldersCount} Subfolder (Klik untuk buka)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenMove(folder)}
                          disabled={isPending}
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer"
                          title="Pindah lokasi folder (Move)"
                        >
                          <ArrowsLeftRight size={15} weight="bold" />
                        </button>
                        <FolderShareDialog
                          folderId={folder.id}
                          folderName={folder.name}
                          folderColor={folder.color}
                          initialIsShared={isFolderShared}
                          initialSlug={sharedFolderMap[folder.id] ?? null}
                          notesCount={folder.notesCount}
                          triggerButton={
                            <button
                              type="button"
                              disabled={isPending}
                              className={`p-1.5 border rounded-xs transition-colors cursor-pointer ${
                                isFolderShared
                                  ? "bg-purple-200 text-purple-900 border-black hover:bg-purple-300"
                                  : "text-neutral-600 hover:text-black hover:bg-neutral-100 border-transparent hover:border-black"
                              }`}
                              title={isFolderShared ? "Folder Publik Aktif" : "Bagikan folder ke publik"}
                            >
                              {isFolderShared ? (
                                <Globe size={15} weight="bold" />
                              ) : (
                                <ShareNetwork size={15} weight="bold" />
                              )}
                            </button>
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(folder)}
                          disabled={isPending}
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                          title="Edit folder"
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(folder.id, folder.name)}
                          disabled={isPending}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                          title="Hapus folder"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </div>

                    {/* Quick navigation & counts bar */}
                    <div className="space-y-2 pt-2 border-t border-black/10">
                      {/* Subfolder drill-down button */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCreateSubfolder(folder.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 hover:text-black bg-neutral-100 hover:bg-yellow-200 px-2 py-0.5 border border-black/30 rounded-xs transition-colors cursor-pointer"
                          title="Buat subfolder di dalam folder ini"
                        >
                          <Plus size={11} weight="bold" />
                          <span>+ Subfolder</span>
                        </button>

                        {folder.subfoldersCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCurrentParentId(folder.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-black hover:underline cursor-pointer"
                          >
                            <span>Buka Subfolder</span>
                            <CaretRight size={12} weight="bold" />
                          </button>
                        )}
                      </div>

                      {/* Content Links */}
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/notes?folderId=${folder.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-yellow-100 hover:bg-yellow-200 border border-black/30 rounded-xs text-black transition-colors"
                          title="Lihat catatan di folder ini"
                        >
                          <Note size={12} weight="bold" />
                          <span>{folder.notesCount} Catatan</span>
                        </Link>
                        <Link
                          href={`/kanban?folderId=${folder.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 hover:bg-blue-200 border border-black/30 rounded-xs text-black transition-colors"
                          title="Lihat papan kanban di folder ini"
                        >
                          <Kanban size={12} weight="bold" />
                          <span>{folder.boardsCount} Kanban</span>
                        </Link>
                        <Link
                          href={`/checklists?folderId=${folder.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 border border-black/30 rounded-xs text-black transition-colors"
                          title="Lihat checklist di folder ini"
                        >
                          <CheckSquareOffset size={12} weight="bold" />
                          <span>{folder.checklistsCount} Checklist</span>
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 4. Create Folder Dialog */}
      {isCreateModalOpen && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-4">
            <DialogHeader className="border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-yellow-400 border border-black">
                  <FolderPlus size={18} weight="bold" />
                </span>
                <DialogTitle className="font-black text-base text-black">
                  Buat Folder Baru
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-black block mb-1">Nama Folder *</label>
                <input
                  suppressHydrationWarning
                  autoFocus
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Nama folder (misal: Pekerjaan, Proyek X)..."
                  className="w-full border-2 border-black px-3 py-2 text-xs focus:outline-none focus:bg-yellow-50 font-bold"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1">Folder Induk (Parent)</label>
                <FolderSelect
                  value={createParentId}
                  onChange={setCreateParentId}
                  folders={folders}
                  placeholder="— Folder Utama (Root Level) —"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1.5">Warna Penanda</label>
                <ColorPicker value={createColor} onChange={setCreateColor} />
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isPending}
                  className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isPending || !createName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50 min-w-[120px] justify-center"
                >
                  {isPending ? (
                    <>
                      <CircleNotch size={14} weight="bold" className="animate-spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <span>Buat Folder</span>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. Edit Folder Dialog */}
      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={(o) => !o && setEditingFolder(null)}>
          <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-4">
            <DialogHeader className="border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-yellow-400 border border-black">
                  <PencilSimple size={16} weight="bold" />
                </span>
                <DialogTitle className="font-black text-base text-black">
                  Edit Folder
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <label className="font-bold text-black block mb-1">Nama Folder *</label>
                <input
                  suppressHydrationWarning
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 text-xs focus:outline-none focus:bg-yellow-50 font-bold"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1">Folder Induk (Pindah Lokasi)</label>
                <FolderSelect
                  value={editParentId}
                  onChange={setEditParentId}
                  folders={folders}
                  disabledFolderIds={moveDisabledFolderIds}
                  placeholder="— Folder Utama (Root Level) —"
                  disabled={isPending}
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Folder tidak dapat dipindahkan ke dirinya sendiri atau ke dalam subfoldernya.
                </p>
              </div>

              <div>
                <label className="font-bold text-black block mb-1.5">Warna Penanda</label>
                <ColorPicker value={editColor} onChange={setEditColor} />
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  disabled={isPending}
                  className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending || !editName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50 min-w-[130px] justify-center"
                >
                  {isPending ? (
                    <>
                      <CircleNotch size={14} weight="bold" className="animate-spin" />
                      <span>Menyimpan…</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Quick Move Folder Dialog */}
      {movingFolder && (
        <Dialog open={!!movingFolder} onOpenChange={(o) => !o && setMovingFolder(null)}>
          <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-4">
            <DialogHeader className="border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-yellow-400 border border-black">
                  <ArrowsLeftRight size={16} weight="bold" />
                </span>
                <DialogTitle className="font-black text-base text-black">
                  Pindah Lokasi Folder
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-1 text-xs">
              <p className="text-xs text-neutral-700">
                Pilih folder induk baru untuk folder <strong>&quot;{movingFolder.name}&quot;</strong>:
              </p>

              <div>
                <label className="font-bold text-black block mb-1">Target Folder Induk</label>
                <FolderSelect
                  value={moveTargetParentId}
                  onChange={setMoveTargetParentId}
                  folders={folders}
                  disabledFolderIds={moveDisabledFolderIds}
                  placeholder="— Folder Utama (Root Level) —"
                  disabled={isPending}
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Folder tidak dapat dipindahkan ke dirinya sendiri atau ke dalam subfoldernya.
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setMovingFolder(null)}
                  disabled={isPending}
                  className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveMove}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50 min-w-[120px] justify-center"
                >
                  {isPending ? (
                    <>
                      <CircleNotch size={14} weight="bold" className="animate-spin" />
                      <span>Memindahkan…</span>
                    </>
                  ) : (
                    <span>Pindahkan Folder</span>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
