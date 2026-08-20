import { columnRepository } from "@/features/kanban/repositories/column.repository";
import { boardRepository } from "@/features/kanban/repositories/board.repository";
import { NotFoundError } from "@/lib/errors";
import type { KanbanColumn } from "@/lib/db/schema";

export const columnService = {
  async getByBoard(boardId: string): Promise<KanbanColumn[]> {
    return columnRepository.findByBoardId(boardId);
  },
  async create(boardId: string, name: string, color?: string | null): Promise<KanbanColumn> {
    const cols = await columnRepository.findByBoardId(boardId);
    const position = cols.length;
    return columnRepository.create({ boardId, name, color: color ?? null, position });
  },
  async update(id: string, data: { name?: string; color?: string | null }): Promise<KanbanColumn> {
    const col = await columnRepository.update(id, data);
    if (!col) throw new NotFoundError("Kolom tidak ditemukan.");
    return col;
  },
  async delete(id: string): Promise<void> {
    await columnRepository.delete(id);
  },
  async reorder(items: { id: string; position: number }[]): Promise<void> {
    await columnRepository.bulkUpdatePositions(items);
  },
};
