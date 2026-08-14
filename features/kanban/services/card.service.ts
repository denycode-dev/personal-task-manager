import { cardRepository } from "@/features/kanban/repositories/card.repository";
import { NotFoundError } from "@/lib/errors";
import type { KanbanCard } from "@/lib/db/schema";

export const cardService = {
  async getByColumn(columnId: string): Promise<KanbanCard[]> {
    return cardRepository.findByColumnId(columnId);
  },
  async create(input: { columnId: string; title: string; description?: string | null; deadline?: Date | null }): Promise<KanbanCard> {
    const cards = await cardRepository.findByColumnId(input.columnId);
    return cardRepository.create({ ...input, position: cards.length });
  },
  async update(id: string, data: Partial<{ title: string; description: string | null; deadline: Date | null; columnId: string; position: number }>): Promise<KanbanCard> {
    const card = await cardRepository.update(id, data);
    if (!card) throw new NotFoundError("Kartu tidak ditemukan.");
    return card;
  },
  async delete(id: string): Promise<void> {
    await cardRepository.delete(id);
  },
  async reorder(items: { id: string; position: number; columnId?: string }[]): Promise<void> {
    await cardRepository.bulkUpdatePositions(items);
  },
};
