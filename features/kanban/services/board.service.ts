import { boardRepository } from "@/features/kanban/repositories/board.repository";
import { columnRepository } from "@/features/kanban/repositories/column.repository";
import { cardRepository } from "@/features/kanban/repositories/card.repository";
import { attachmentRepository } from "@/features/kanban/repositories/attachment.repository";
import { db } from "@/lib/db";
import { kanbanColumns } from "@/lib/db/schema";
import { deleteFiles } from "@/lib/imagekit/delete";
import { logger } from "@/lib/logger";
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

    // 1. Kumpulkan seluruh fileId lampiran dari semua kartu di seluruh kolom board ini
    const fileIds: string[] = [];
    try {
      const columns = await columnRepository.findByBoardId(id);
      for (const col of columns) {
        const cards = await cardRepository.findByColumnId(col.id);
        for (const card of cards) {
          const atts = await attachmentRepository.findByCardId(card.id);
          for (const a of atts) {
            if (a.imagekitFileId && a.imagekitFileId.trim()) {
              fileIds.push(a.imagekitFileId.trim());
            }
          }
        }
      }
    } catch (fetchErr) {
      logger.warn("Failed to query attachments before board deletion", {
        boardId: id,
        error: fetchErr,
      });
    }

    // 2. Hapus board dari database (cascade delete)
    await boardRepository.delete(id);

    // 3. Hapus seluruh berkas lampiran dari server ImageKit
    if (fileIds.length > 0) {
      await deleteFiles(fileIds).catch((delErr) => {
        logger.warn("Failed to delete attachments from ImageKit for board", {
          boardId: id,
          fileIds,
          error: delErr,
        });
      });
    }
  },
};