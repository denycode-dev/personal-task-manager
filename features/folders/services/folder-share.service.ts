import { randomBytes } from "crypto";
import { cache } from "react";
import { folderShareRepository } from "@/features/folders/repositories/folder-share.repository";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import { extractNoteExcerpt } from "@/features/notes/services/note-share.service";
import { extractPlainText } from "@/features/notes/utils/reading-utils";
import { NotFoundError } from "@/lib/errors";

export interface PublicFolderNoteItem {
  id: string;
  title: string;
  snippet: string;
  isLocked: boolean;
  shareSlug: string;
  version: number;
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
   * Mengambil data folder publik beserta seluruh catatan di dalamnya.
   * Menggunakan React cache() untuk deduplikasi antara generateMetadata dan Page render.
   */
  getPublicFolder: cache(async (slug: string): Promise<PublicFolderData | null> => {
    const share = await folderShareRepository.findBySlug(slug);
    if (!share) return null;

    const folder = await folderRepository.findById(share.folderId);
    if (!folder) return null;

    const allNotes = await noteRepository.findAll(folder.id);
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

    const publicNotes: PublicFolderNoteItem[] = allNotes.map((note) => {
      const isLocked = lockedIdSet.has(note.id);
      const snippet = isLocked
        ? "Catatan ini dilindungi kata sandi."
        : (extractPlainText(note.content)?.replace(/\s+/g, " ").trim() || "Tidak ada cuplikan teks.");

      return {
        id: note.id,
        title: note.title || "Catatan Tanpa Judul",
        snippet,
        isLocked,
        shareSlug: shareMap.get(note.id) || note.id,
        version: note.version ?? 1,
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
      notes: publicNotes,
      slug,
      totalNotes: publicNotes.length,
    };
  }),

  /**
   * Mengambil detail catatan tunggal di dalam folder publik.
   */
  getPublicFolderNoteDetail: cache(async (folderSlug: string, noteId: string) => {
    const share = await folderShareRepository.findBySlug(folderSlug);
    if (!share) return null;

    const note = await noteRepository.findById(noteId);
    if (!note || note.folderId !== share.folderId) return null;

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
