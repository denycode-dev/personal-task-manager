import { noteRepository } from "@/features/notes/repositories/note.repository";
import { deleteFiles, deleteFileByUrl, extractImageKitFilesFromContent } from "@/lib/imagekit/delete";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import type { CreateNoteInput, UpdateNoteInput } from "@/features/notes/schemas/note.schema";
import type { Note } from "@/lib/db/schema";

export const noteService = {
  async getAll(folderId?: string | null): Promise<Note[]> {
    return noteRepository.findAll(folderId);
  },

  async getById(id: string): Promise<Note> {
    const note = await noteRepository.findById(id);
    if (!note) throw new NotFoundError("Catatan tidak ditemukan.");
    return note;
  },

  async create(input: CreateNoteInput): Promise<Note> {
    return noteRepository.create({
      title: input.title,
      content: input.content ?? null,
      folderId: input.folderId ?? null,
    });
  },

  async createMany(inputs: CreateNoteInput[]): Promise<Note[]> {
    if (inputs.length === 0) return [];
    return noteRepository.createMany(
      inputs.map((input) => ({
        title: input.title,
        content: input.content ?? null,
        folderId: input.folderId ?? null,
      }))
    );
  },

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    const existing = await noteRepository.findById(id);
    if (!existing) throw new NotFoundError("Catatan tidak ditemukan.");
    const updated = await noteRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.folderId !== undefined && { folderId: input.folderId }),
    });
    return updated!;
  },

  async delete(id: string): Promise<void> {
    const existing = await noteRepository.findById(id);
    if (!existing) throw new NotFoundError("Catatan tidak ditemukan.");

    // 1. Ekstrak seluruh ImageKit fileId & URL dari konten catatan
    const { fileIds, urls } = extractImageKitFilesFromContent(existing.content);

    // 2. Hapus catatan dari database
    await noteRepository.delete(id);

    // 3. Hapus seluruh berkas gambar ImageKit terkait dari server ImageKit
    if (fileIds.length > 0) {
      await deleteFiles(fileIds).catch((delErr) => {
        logger.warn("Failed to delete Note ImageKit files by fileId", {
          noteId: id,
          fileIds,
          error: delErr,
        });
      });
    }

    if (urls.length > 0) {
      await Promise.allSettled(urls.map((u) => deleteFileByUrl(u)));
    }
  },
};