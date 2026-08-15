import { checklistRepository } from "@/features/checklists/repositories/checklist.repository";
import { checklistItemRepository } from "@/features/checklists/repositories/checklist-item.repository";
import { NotFoundError } from "@/lib/errors";
import type { Checklist, ChecklistItem } from "@/lib/db/schema";

export const checklistService = {
  async getAll(folderId?: string): Promise<Checklist[]> {
    return checklistRepository.findAll(folderId);
  },
  async getById(id: string): Promise<Checklist> {
    const cl = await checklistRepository.findById(id);
    if (!cl) throw new NotFoundError("Checklist tidak ditemukan.");
    return cl;
  },
  async create(title: string, folderId?: string | null): Promise<Checklist> {
    return checklistRepository.create({ title, folderId: folderId ?? null });
  },
  async update(id: string, data: { title?: string; folderId?: string | null }): Promise<Checklist> {
    const existing = await checklistRepository.findById(id);
    if (!existing) throw new NotFoundError("Checklist tidak ditemukan.");
    const updated = await checklistRepository.update(id, data);
    if (!updated) throw new NotFoundError("Gagal memperbarui checklist.");
    return updated;
  },
  async delete(id: string): Promise<void> {
    const existing = await checklistRepository.findById(id);
    if (!existing) throw new NotFoundError("Checklist tidak ditemukan.");
    await checklistRepository.delete(id);
  },
  async addItem(checklistId: string, content: string, deadline?: Date | null): Promise<ChecklistItem> {
    const items = await checklistItemRepository.findByChecklistId(checklistId);
    return checklistItemRepository.create({ checklistId, content, position: items.length, deadline: deadline ?? null });
  },
  async toggleItem(itemId: string, isDone: boolean): Promise<ChecklistItem> {
    const item = await checklistItemRepository.toggle(itemId, isDone);
    if (!item) throw new NotFoundError("Item tidak ditemukan.");
    return item;
  },
  async deleteItem(itemId: string): Promise<void> { await checklistItemRepository.delete(itemId); },
};
