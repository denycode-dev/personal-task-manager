import { randomBytes } from "crypto";
import { cache } from "react";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { NotFoundError } from "@/lib/errors";

export interface PublicNoteItem {
  id: string;
  title: string;
  content: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicNoteData {
  note: PublicNoteItem;
  isLocked: boolean;
  slug: string;
}

export interface NoteShareStatus {
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

/**
 * Ekstraksi ringkasan teks polos dari format Tiptap JSON, HTML, atau string untuk meta description.
 */
export function extractNoteExcerpt(
  content: unknown,
  isLocked: boolean,
  maxLength: number = 160
): string {
  if (isLocked) {
    return "Catatan ini terenkripsi dan diproteksi dengan password.";
  }

  if (!content) {
    return "Catatan publik yang dibagikan melalui Denycode Task Manager.";
  }

  let text = "";

  const extractRecursive = (node: unknown): void => {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) {
        extractRecursive(item);
      }
      return;
    }

    const record = node as Record<string, unknown>;

    if (record.type === "text" && typeof record.text === "string") {
      const segment = record.text.trim();
      if (segment) {
        text += (text.length > 0 ? " " : "") + segment;
      }
    }

    if (Array.isArray(record.content)) {
      extractRecursive(record.content);
    }
  };

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      extractRecursive(parsed);
    } catch {
      text = content.replace(/<[^>]*>?/gm, "").trim();
    }
  } else {
    extractRecursive(content);
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Catatan publik yang dibagikan melalui Denycode Task Manager.";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export const noteShareService = {
  async getShareByNoteId(noteId: string): Promise<NoteShareStatus> {
    const share = await noteShareRepository.findByNoteId(noteId);
    return {
      isShared: !!share,
      publicSlug: share?.publicSlug ?? null,
    };
  },

  async enableShare(noteId: string): Promise<{ publicSlug: string }> {
    const note = await noteRepository.findById(noteId);
    if (!note) throw new NotFoundError("Catatan tidak ditemukan.");

    const existing = await noteShareRepository.findByNoteId(noteId);
    if (existing) {
      return { publicSlug: existing.publicSlug };
    }

    const publicSlug = generateSlug(10);
    const created = await noteShareRepository.create({
      noteId,
      publicSlug,
    });

    return { publicSlug: created.publicSlug };
  },

  async disableShare(noteId: string): Promise<void> {
    await noteShareRepository.delete(noteId);
  },

  /**
   * Mengambil data catatan publik berdasarkan slug.
   * Menggunakan React cache() untuk menduplikasi fetch antara generateMetadata dan Page render.
   */
  getPublicNote: cache(async (slug: string): Promise<PublicNoteData | null> => {
    const share = await noteShareRepository.findBySlug(slug);
    if (!share) return null;

    const note = await noteRepository.findById(share.noteId);
    if (!note) return null;

    const lock = await noteLockRepository.findByNoteId(note.id);

    return {
      note: {
        id: note.id,
        title: note.title,
        content: lock ? null : note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
      isLocked: !!lock,
      slug,
    };
  }),
};
