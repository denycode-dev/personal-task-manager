import { folderRepository } from "@/features/folders/repositories/folder.repository";
import type { CreateFolderInput, UpdateFolderInput } from "@/features/folders/schemas/folder.schema";
import { NotFoundError } from "@/lib/errors";
import type { Folder } from "@/lib/db/schema";

export const folderService = {
  async getAll(): Promise<Folder[]> {
    return folderRepository.findAll();
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