import { db } from "@/lib/db";
import { notes, kanbanBoards, checklists } from "@/lib/db/schema";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import type { CreateFolderInput, UpdateFolderInput } from "@/features/folders/schemas/folder.schema";
import { NotFoundError } from "@/lib/errors";
import type { Folder } from "@/lib/db/schema";

export type FolderWithCounts = Folder & {
  notesCount: number;
  boardsCount: number;
  checklistsCount: number;
};

export const folderService = {
  async getAll(): Promise<Folder[]> {
    return folderRepository.findAll();
  },

  async getFoldersWithCounts(): Promise<FolderWithCounts[]> {
    const [allFolders, allNotes, allBoards, allChecklists] = await Promise.all([
      folderRepository.findAll(),
      db.select({ folderId: notes.folderId }).from(notes),
      db.select({ folderId: kanbanBoards.folderId }).from(kanbanBoards),
      db.select({ folderId: checklists.folderId }).from(checklists),
    ]);

    const noteCounts = new Map<string, number>();
    for (const n of allNotes) {
      if (n.folderId) noteCounts.set(n.folderId, (noteCounts.get(n.folderId) ?? 0) + 1);
    }

    const boardCounts = new Map<string, number>();
    for (const b of allBoards) {
      if (b.folderId) boardCounts.set(b.folderId, (boardCounts.get(b.folderId) ?? 0) + 1);
    }

    const checklistCounts = new Map<string, number>();
    for (const c of allChecklists) {
      if (c.folderId) checklistCounts.set(c.folderId, (checklistCounts.get(c.folderId) ?? 0) + 1);
    }

    return allFolders.map((f) => ({
      ...f,
      notesCount: noteCounts.get(f.id) ?? 0,
      boardsCount: boardCounts.get(f.id) ?? 0,
      checklistsCount: checklistCounts.get(f.id) ?? 0,
    }));
  },

  async create(input: CreateFolderInput): Promise<Folder> {
    return folderRepository.create(input);
  },

  async update(id: string, input: UpdateFolderInput): Promise<Folder> {
    const existing = await folderRepository.findById(id);
    if (!existing) throw new NotFoundError("Folder tidak ditemukan.");
    const updated = await folderRepository.update(id, input);
    return updated!;
  },

  async delete(id: string): Promise<void> {
    const existing = await folderRepository.findById(id);
    if (!existing) throw new NotFoundError("Folder tidak ditemukan.");
    await folderRepository.delete(id);
  },
};