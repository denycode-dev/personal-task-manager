import { boardRepository } from "@/features/kanban/repositories/board.repository";
import { db } from "@/lib/db";
import { kanbanColumns } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";
import type { CreateBoardInput } from "@/features/kanban/schemas";
import type { KanbanBoard } from "@/lib/db/schema";

const DEFAULT_COLUMNS = [
  { name: "Tugas", position: 0 },
  { name: "Dalam Progress", position: 1 },
  { name: "Selesai", position: 2 },
];

export const boardService = {
  async getAll(folderId?: string): Promise<KanbanBoard[]> {
    return boardRepository.findAll(folderId);
  },

  async getById(id: string): Promise<KanbanBoard> {
    const board = await boardRepository.findById(id);
    if (!board) throw new NotFoundError("Board tidak ditemukan.");
    return board;
  },

  async create(input: CreateBoardInput): Promise<KanbanBoard> {
    const board = await boardRepository.create({
      title: input.title,
      folderId: input.folderId ?? null,
    });

    await db.insert(kanbanColumns).values(
      DEFAULT_COLUMNS.map((col) => ({ boardId: board.id, ...col }))
    );

    return board;
  },

  async update(id: string, data: { title?: string; folderId?: string | null }): Promise<KanbanBoard> {
    const existing = await boardRepository.findById(id);
    if (!existing) throw new NotFoundError("Board tidak ditemukan.");
    const updated = await boardRepository.update(id, data);
    if (!updated) throw new NotFoundError("Gagal memperbarui board.");
    return updated;
  },

  async delete(id: string): Promise<void> {
    const existing = await boardRepository.findById(id);
    if (!existing) throw new NotFoundError("Board tidak ditemukan.");
    await boardRepository.delete(id);
  },
};