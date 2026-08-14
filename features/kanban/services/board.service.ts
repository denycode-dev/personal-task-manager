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
  async getAll(): Promise<KanbanBoard[]> {
    return boardRepository.findAll();
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

  async delete(id: string): Promise<void> {
    const existing = await boardRepository.findById(id);
    if (!existing) throw new NotFoundError("Board tidak ditemukan.");
    await boardRepository.delete(id);
  },
};