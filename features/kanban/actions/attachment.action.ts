"use server";

import { requireAuth } from "@/lib/auth/session";
import { attachmentRepository } from "@/features/kanban/repositories/attachment.repository";
import { deleteFile } from "@/lib/imagekit/delete";
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
    return { success: false, error: "Gagal menyimpan data lampiran." };
  }
}

export async function deleteCardAttachmentAction(
  id: string,
  imagekitFileId: string
): Promise<ActionResult<undefined>> {
  await requireAuth();
  try {
    await attachmentRepository.delete(id);
    if (imagekitFileId) {
      await deleteFile(imagekitFileId).catch(() => {});
    }
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: "Gagal menghapus lampiran." };
  }
}
