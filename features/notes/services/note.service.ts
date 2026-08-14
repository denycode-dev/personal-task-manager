import { noteRepository } from "@/features/notes/repositories/note.repository";
import type { CreateNoteInput, UpdateNoteInput } from "@/features/notes/schemas/note.schema";
import { NotFoundError } from "@/lib/errors";
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

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    const existing = await noteRepository.findById(id);
    if (!existing) throw new NotFoundError("Catatan tidak ditemukan.");
    const updated = await noteRepository.update(id, {
      ...(input.title && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.folderId !== undefined && { folderId: input.folderId }),
    });
    return updated!;
  },

  async delete(id: string): Promise<void> {
    const existing = await noteRepository.findById(id);
    if (!existing) throw new NotFoundError("Catatan tidak ditemukan.");
    await noteRepository.delete(id);
  },
};