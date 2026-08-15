"use client";

import { useState, useTransition } from "react";
import {
  createFolderAction,
  updateFolderAction,
  deleteFolderAction,
} from "@/features/folders/actions/folder.action";
import { toast } from "sonner";
import { useConfirm } from "@/lib/hooks/use-confirm";
import Link from "next/link";
import {
  Trash,
  Plus,
  Folder,
  FolderPlus,
  FolderOpen,
  PencilSimple,
  X,
  Note,
  Kanban,
  CheckSquareOffset,
  CircleNotch,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Folder as FolderType } from "@/lib/db/schema";
import type { FolderWithCounts } from "@/features/folders/services/folder.service";

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
          className={`w-6 h-6 border-2 transition-transform ${
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
}: {
  initialFolders: (FolderType | FolderWithCounts)[];
}) {
  const [folders, setFolders] = useState<(FolderType | FolderWithCounts)[]>(initialFolders);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);

  // Edit modal state
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createFolderAction({ name: name.trim(), color });
      if (result.success) {
        setFolders((prev) => [
          ...prev,
          { ...result.data, notesCount: 0, boardsCount: 0, checklistsCount: 0 },
        ]);
        setName("");
        toast.success("Folder berhasil dibuat.");
      } else toast.error(result.error);
    });
  };

  const handleOpenEdit = (folder: FolderType) => {
    setEditingFolder(folder);
    setEditName(folder.name);
    setEditColor(folder.color);
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
      });
      if (result.success) {
        setFolders((prev) =>
          prev.map((f) => (f.id === editingFolder.id ? { ...f, ...result.data } : f))
        );
        setEditingFolder(null);
        toast.success("Folder berhasil diperbarui.");
      } else toast.error(result.error);
    });
  };

  const handleDelete = async (id: string, folderName: string) => {
    const ok = await confirm({
      title: "Hapus Folder",
      message: `Hapus folder "${folderName}"? Catatan, papan kanban, dan checklist di dalamnya tidak akan terhapus, melainkan dikeluarkan dari folder (ungrouped).`,
      confirmLabel: "Hapus Folder",
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteFolderAction(id);
      if (result.success) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        toast.success("Folder berhasil dihapus.");
      } else toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="flex items-center gap-2">
          <FolderPlus size={20} weight="bold" />
          <h2 className="font-black text-sm">Buat Folder Baru</h2>
        </div>

        <div className="flex gap-2">
          <input
            suppressHydrationWarning
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nama folder (misal: Pekerjaan, Proyek X, Kuliah)..."
            disabled={isPending}
            className="flex-1 border-2 border-black px-3 py-1.5 text-xs bg-white focus:outline-none focus:bg-yellow-50"
          />
        </div>

        <div>
          <p className="text-[11px] font-bold text-muted-foreground mb-1.5">Pilih Warna Penanda:</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <button
          suppressHydrationWarning
          type="button"
          onClick={handleCreate}
          disabled={isPending || !name.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-0.5 transition-transform min-w-[120px] justify-center"
        >
          {isPending ? (
            <>
              <CircleNotch size={14} weight="bold" className="animate-spin" />
              <span>Membuat...</span>
            </>
          ) : (
            <>
              <Plus size={14} weight="bold" />
              <span>Buat Folder</span>
            </>
          )}
        </button>
      </div>

      {/* List */}
      {folders.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-black/30 bg-purple-50/50 space-y-2">
          <FolderOpen size={32} weight="bold" className="mx-auto text-neutral-500" />
          <p className="text-sm font-bold text-black">Belum ada folder kustom.</p>
          <p className="text-xs text-muted-foreground">
            Buat folder di atas untuk mengelompokkan catatan, papan kanban, dan checklist-mu.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => {
            const folderWithCounts = folder as Partial<FolderWithCounts>;
            return (
              <li
                key={folder.id}
                className="flex flex-col justify-between p-3.5 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-4 h-4 flex-shrink-0 border-2 border-black rounded-xs"
                      style={{ backgroundColor: folder.color }}
                    />
                    <Folder size={18} weight="fill" className="text-neutral-700 shrink-0" />
                    <span className="font-black text-sm text-black truncate">
                      {folder.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => handleOpenEdit(folder)}
                      disabled={isPending}
                      className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50"
                      title="Edit folder"
                    >
                      <PencilSimple size={15} weight="bold" />
                    </button>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => handleDelete(folder.id, folder.name)}
                      disabled={isPending}
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50"
                      title="Hapus folder"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Cross-type stats with quick-links */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-black/10">
                  <Link
                    href={`/notes?folderId=${folder.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-yellow-100 hover:bg-yellow-200 border border-black/30 rounded-xs text-black transition-colors"
                    title="Lihat catatan di folder ini"
                  >
                    <Note size={12} weight="bold" />
                    <span>{folderWithCounts.notesCount ?? 0} Catatan</span>
                  </Link>
                  <Link
                    href={`/kanban?folderId=${folder.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-blue-100 hover:bg-blue-200 border border-black/30 rounded-xs text-black transition-colors"
                    title="Lihat papan kanban di folder ini"
                  >
                    <Kanban size={12} weight="bold" />
                    <span>{folderWithCounts.boardsCount ?? 0} Kanban</span>
                  </Link>
                  <Link
                    href={`/checklists?folderId=${folder.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 border border-black/30 rounded-xs text-black transition-colors"
                    title="Lihat checklist di folder ini"
                  >
                    <CheckSquareOffset size={12} weight="bold" />
                    <span>{folderWithCounts.checklistsCount ?? 0} Checklist</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Edit Folder Dialog */}
      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={(o) => !o && setEditingFolder(null)}>
          <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-4 animate-in fade-in zoom-in-95">
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
                  className="w-full border-2 border-black px-3 py-2 text-xs focus:outline-none focus:bg-yellow-50 disabled:opacity-60"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1.5">Warna Penanda</label>
                <ColorPicker value={editColor} onChange={setEditColor} />
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t-2 border-black/10">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  disabled={isPending}
                  className="px-3.5 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending || !editName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 min-w-[130px] justify-center"
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
    </div>
  );
}
