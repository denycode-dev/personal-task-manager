import { cardRepository } from "@/features/kanban/repositories/card.repository";
import { attachmentRepository } from "@/features/kanban/repositories/attachment.repository";
import { deleteFiles } from "@/lib/imagekit/delete";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import type { KanbanCard } from "@/lib/db/schema";

export const cardService = {
  async getByColumn(columnId: string): Promise<KanbanCard[]> {
    return cardRepository.findByColumnId(columnId);
  },

  async create(input: {
    columnId: string;
    title: string;
    description?: string | null;
    deadline?: Date | null;
  }): Promise<KanbanCard> {
    const cards = await cardRepository.findByColumnId(input.columnId);
    return cardRepository.create({ ...input, position: cards.length });
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      deadline: Date | null;
      columnId: string;
      position: number;
    }>
  ): Promise<KanbanCard> {
    const card = await cardRepository.update(id, data);
    if (!card) throw new NotFoundError("Kartu tidak ditemukan.");
    return card;
  },

  async delete(id: string): Promise<void> {
    // 1. Ambil seluruh lampiran kartu sebelum dihapus dari DB
    let fileIds: string[] = [];
    try {
      const attachments = await attachmentRepository.findByCardId(id);
      fileIds = attachments
        .map((a) => a.imagekitFileId)
        .filter((fid): fid is string => Boolean(fid && fid.trim()));
    } catch (fetchErr) {
      logger.warn("Failed to query attachments before card deletion", {
        cardId: id,
        error: fetchErr,
      });
    }

    // 2. Hapus kartu dari database (cascade delete di Postgres)
    await cardRepository.delete(id);

    // 3. Hapus seluruh file lampiran terkait dari server ImageKit
    if (fileIds.length > 0) {
      await deleteFiles(fileIds).catch((delErr) => {
        logger.warn("Failed to delete attachments from ImageKit for card", {
          cardId: id,
          fileIds,
          error: delErr,
        });
      });
    }
  },

  async reorder(
    items: { id: string; position: number; columnId?: string }[]
  ): Promise<void> {
    await cardRepository.bulkUpdatePositions(items);
  },
};
