import { randomBytes } from "crypto";
import { cache } from "react";
import { folderShareRepository } from "@/features/folders/repositories/folder-share.repository";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { folderService } from "@/features/folders/services/folder.service";
import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import { extractPlainText } from "@/features/notes/utils/reading-utils";
import { NotFoundError } from "@/lib/errors";

export interface PublicFolderSubfolderItem {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  depth: number;
  path: string;
  notesCount: number;
}

export interface PublicFolderNoteItem {
  id: string;
  title: string;
  content: unknown | null;
  snippet: string;
  isLocked: boolean;
  shareSlug: string;
  version: number;
  folderId?: string | null;
  folderName?: string;
  folderColor?: string;
  folderPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicFolderData {
  folder: {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  };
  breadcrumbs?: { id: string; name: string; color: string }[];
  subfolders: PublicFolderSubfolderItem[];
  notes: PublicFolderNoteItem[];
  slug: string;
  totalNotes: number;
}

export interface FolderShareStatus {
  isShared: boolean;
  publicSlug: string | null;
}

function generateSlug(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export const folderShareService = {
  async getShareByFolderId(folderId: string): Promise<FolderShareStatus> {
    const share = await folderShareRepository.findByFolderId(folderId);
    return {
      isShared: !!share,
      publicSlug: share?.publicSlug ?? null,
    };
  },

  async getSharesMap(folderIds: string[]): Promise<Record<string, string>> {
    if (folderIds.length === 0) return {};
    const shares = await folderShareRepository.findByFolderIds(folderIds);
    const map: Record<string, string> = {};
    for (const s of shares) {
      map[s.folderId] = s.publicSlug;
    }
    return map;
  },

  async enableShare(folderId: string): Promise<{ publicSlug: string }> {
    const folder = await folderRepository.findById(folderId);
    if (!folder) throw new NotFoundError("Folder tidak ditemukan.");

    const existing = await folderShareRepository.findByFolderId(folderId);
    if (existing) {
      return { publicSlug: existing.publicSlug };
    }

    const publicSlug = generateSlug(10);
    const created = await folderShareRepository.create({
      folderId,
      publicSlug,
    });

    return { publicSlug: created.publicSlug };
  },

  async disableShare(folderId: string): Promise<void> {
    await folderShareRepository.delete(folderId);
  },

  /**
   * Mengambil data folder publik beserta seluruh catatan dan subfolder di dalamnya.
   * Menggunakan React cache() untuk deduplikasi antara generateMetadata dan Page render.
   */
  getPublicFolder: cache(async (slug: string): Promise<PublicFolderData | null> => {
    const share = await folderShareRepository.findBySlug(slug);
    if (!share) return null;

    const folder = await folderRepository.findById(share.folderId);
    if (!folder) return null;

    const allFolders = await folderRepository.findAll();
    const descendantIds = folderService.getDescendantFolderIds(folder.id, allFolders);
    const targetFolderIds = [folder.id, ...descendantIds];
    const breadcrumbs = folderService.getFolderPath(folder.id, allFolders);

    const folderMap = new Map(allFolders.map((f) => [f.id, f]));
    const allNotes = await noteRepository.findByFolderIds(targetFolderIds);
    const noteIds: string[] = allNotes.map((n) => n.id);

    // Ambil daftar lock untuk catatan-catatan di folder ini
    const locks = noteIds.length > 0
      ? await Promise.all(noteIds.map((id: string) => noteLockRepository.findByNoteId(id).catch(() => null)))
      : [];
    const lockedIdSet = new Set<string>(
      locks.filter((l): l is NonNullable<typeof l> => Boolean(l)).map((l) => l.noteId)
    );

    // Ambil atau buat shareSlug untuk setiap catatan di dalam folder publik
    const existingShares = noteIds.length > 0
      ? await Promise.all(noteIds.map((id: string) => noteShareRepository.findByNoteId(id).catch(() => null)))
      : [];
    const shareMap = new Map<string, string>();
    for (let i = 0; i < noteIds.length; i++) {
      const s = existingShares[i];
      if (s) {
        shareMap.set(noteIds[i], s.publicSlug);
      }
    }

    // Untuk catatan yang belum memiliki slug share, buatkan slug publik
    for (const noteId of noteIds) {
      if (!shareMap.has(noteId)) {
        const publicSlug = generateSlug(10);
        const created = await noteShareRepository.create({
          noteId,
          publicSlug,
          isEditable: false,
        }).catch(() => null);
        shareMap.set(noteId, created?.publicSlug || publicSlug);
      }
    }

    // Hitung catatan per subfolder
    const notesCountPerFolder: Record<string, number> = {};
    for (const n of allNotes) {
      if (n.folderId) {
        notesCountPerFolder[n.folderId] = (notesCountPerFolder[n.folderId] || 0) + 1;
      }
    }

    // Siapkan daftar subfolder di bawah folder publik
    const subfolders: PublicFolderSubfolderItem[] = descendantIds.map((subId) => {
      const sub = folderMap.get(subId)!;
      const pathCrumbs = folderService.getFolderPath(sub.id, allFolders);
      // Path relative to shared folder
      const relPath = pathCrumbs.map((c) => c.name).join(" / ");
      return {
        id: sub.id,
        name: sub.name,
        color: sub.color,
        parentId: sub.parentId,
        depth: pathCrumbs.length - breadcrumbs.length,
        path: relPath,
        notesCount: notesCountPerFolder[sub.id] || 0,
      };
    });

    const publicNotes: PublicFolderNoteItem[] = allNotes.map((note) => {
      const isLocked = lockedIdSet.has(note.id);
      const snippet = isLocked
        ? "Catatan ini dilindungi kata sandi."
        : (extractPlainText(note.content)?.replace(/\s+/g, " ").trim() || "Tidak ada cuplikan teks.");

      const noteFolder = note.folderId ? folderMap.get(note.folderId) : undefined;
      const noteFolderPath = note.folderId
        ? folderService.getFolderPath(note.folderId, allFolders).map((c) => c.name).join(" / ")
        : undefined;

      return {
        id: note.id,
        title: note.title || "Catatan Tanpa Judul",
        content: isLocked ? null : note.content,
        snippet,
        isLocked,
        shareSlug: shareMap.get(note.id) || note.id,
        version: note.version ?? 1,
        folderId: note.folderId,
        folderName: noteFolder?.name,
        folderColor: noteFolder?.color,
        folderPath: noteFolderPath,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    });

    return {
      folder: {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      },
      breadcrumbs,
      subfolders,
      notes: publicNotes,
      slug,
      totalNotes: publicNotes.length,
    };
  }),

  /**
   * Mengambil detail catatan tunggal di dalam folder publik (termasuk subfolder).
   */
  getPublicFolderNoteDetail: cache(async (folderSlug: string, noteId: string) => {
    const share = await folderShareRepository.findBySlug(folderSlug);
    if (!share) return null;

    const allFolders = await folderRepository.findAll();
    const descendantIds = folderService.getDescendantFolderIds(share.folderId, allFolders);
    const validFolderIds = new Set([share.folderId, ...descendantIds]);

    const note = await noteRepository.findById(noteId);
    if (!note || !note.folderId || !validFolderIds.has(note.folderId)) return null;

    const lock = await noteLockRepository.findByNoteId(note.id);
    const noteShare = await noteShareRepository.findByNoteId(note.id);

    return {
      note: {
        id: note.id,
        title: note.title || "Catatan Tanpa Judul",
        content: lock ? null : note.content,
        version: note.version ?? 1,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
      isLocked: !!lock,
      isEditable: noteShare?.isEditable ?? false,
      folderSlug,
    };
  }),
};
