import { randomBytes } from "crypto";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { NotFoundError } from "@/lib/errors";

function generateSlug(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export const noteShareService = {
  async getShareByNoteId(noteId: string) {
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

  async getPublicNote(slug: string) {
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
        updatedAt: note.updatedAt,
      },
      isLocked: !!lock,
      slug,
    };
  },
};
