"use server";

import { requireAuth } from "@/lib/auth/session";
import { attachmentRepository } from "@/features/kanban/repositories/attachment.repository";
import { deleteFile } from "@/lib/imagekit/delete";
import { logger } from "@/lib/logger";
import type { ActionResult } from "@/types/api";
import type { KanbanCardAttachment } from "@/lib/db/schema";

export async function getCardAttachmentsAction(
  cardId: string
): Promise<ActionResult<KanbanCardAttachment[]>> {
  await requireAuth();
  try {
    const attachments = await attachmentRepository.findByCardId(cardId);
    return { success: true, data: attachments };
  } catch (err) {
    logger.error("Failed to fetch card attachments", err, { cardId });
    return { success: false, error: "Gagal memuat lampiran kartu." };
  }
}

export async function addCardAttachmentAction(
  cardId: string,
  data: {
    fileUrl: string;
    imagekitFileId: string;
    fileName: string;
    fileType?: string;
    fileSize: number;
  }
): Promise<ActionResult<KanbanCardAttachment>> {
  await requireAuth();
  try {
    const created = await attachmentRepository.create({
      cardId,
      fileUrl: data.fileUrl,
      imagekitFileId: data.imagekitFileId,
      fileName: data.fileName,
      fileType: data.fileType ?? null,
      fileSize: data.fileSize,
    });
    return { success: true, data: created };
  } catch (err) {
    logger.error("Failed to save attachment to DB, executing ImageKit rollback", err, {
      cardId,
      imagekitFileId: data.imagekitFileId,
    });

    // ATOMICITY ROLLBACK: Hapus file dari ImageKit jika gagal simpan di database
    if (data.imagekitFileId) {
      await deleteFile(data.imagekitFileId).catch((delErr) => {
        logger.warn("ImageKit rollback delete failed", {
          fileId: data.imagekitFileId,
          error: delErr,
        });
      });
    }

    return { success: false, error: "Gagal menyimpan data lampiran." };
  }
}

export async function deleteCardAttachmentAction(
  id: string,
  imagekitFileId?: string
): Promise<ActionResult<undefined>> {
  await requireAuth();
  try {
    let fileIdToDelete = imagekitFileId;

    if (!fileIdToDelete) {
      const existing = await attachmentRepository.findById(id);
      fileIdToDelete = existing?.imagekitFileId;
    }

    // Hapus dari database
    await attachmentRepository.delete(id);

    // Hapus dari server ImageKit
    if (fileIdToDelete) {
      await deleteFile(fileIdToDelete).catch((delErr) => {
        logger.warn("Failed to delete attachment from ImageKit server", {
          id,
          fileId: fileIdToDelete,
          error: delErr,
        });
      });
    }

    return { success: true, data: undefined };
  } catch (err) {
    logger.error("Failed to delete attachment", err, { id, imagekitFileId });
    return { success: false, error: "Gagal menghapus lampiran." };
  }
}
