import { columnRepository } from "@/features/kanban/repositories/column.repository";
import { cardRepository } from "@/features/kanban/repositories/card.repository";
import { attachmentRepository } from "@/features/kanban/repositories/attachment.repository";
import { deleteFiles } from "@/lib/imagekit/delete";
import { logger } from "@/lib/logger";
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
    // 1. Kumpulkan seluruh fileId lampiran dari semua kartu di kolom ini
    const fileIds: string[] = [];
    try {
      const cards = await cardRepository.findByColumnId(id);
      for (const card of cards) {
        const atts = await attachmentRepository.findByCardId(card.id);
        for (const a of atts) {
          if (a.imagekitFileId && a.imagekitFileId.trim()) {
            fileIds.push(a.imagekitFileId.trim());
          }
        }
      }
    } catch (fetchErr) {
      logger.warn("Failed to query attachments before column deletion", {
        columnId: id,
        error: fetchErr,
      });
    }

    // 2. Hapus kolom dari database
    await columnRepository.delete(id);

    // 3. Hapus seluruh berkas lampiran dari server ImageKit
    if (fileIds.length > 0) {
      await deleteFiles(fileIds).catch((delErr) => {
        logger.warn("Failed to delete attachments from ImageKit for column", {
          columnId: id,
          fileIds,
          error: delErr,
        });
      });
    }
  },

  async reorder(items: { id: string; position: number }[]): Promise<void> {
    await columnRepository.bulkUpdatePositions(items);
  },
};
