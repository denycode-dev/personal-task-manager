"use server";

import { requireAuth } from "@/lib/auth/session";
import { deleteFile, deleteFiles, deleteFileByUrl } from "./delete";
import type { ActionResult } from "@/types/api";

/**
 * Server Action untuk menghapus file dari ImageKit (berdasarkan fileId atau fileUrl).
 */
export async function deleteImageKitFileAction(
  fileIdOrUrl: string
): Promise<ActionResult<undefined>> {
  await requireAuth();
  if (!fileIdOrUrl || typeof fileIdOrUrl !== "string") {
    return { success: true, data: undefined };
  }

  try {
    const trimmed = fileIdOrUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      await deleteFileByUrl(trimmed);
    } else {
      await deleteFile(trimmed);
    }
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal menghapus berkas dari ImageKit.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action untuk menghapus banyak file ImageKit sekaligus dalam batch.
 */
export async function bulkDeleteImageKitFilesAction(
  fileIds: string[]
): Promise<ActionResult<undefined>> {
  await requireAuth();
  if (!fileIds || fileIds.length === 0) {
    return { success: true, data: undefined };
  }

  try {
    await deleteFiles(fileIds);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal menghapus berkas dari ImageKit.";
    return { success: false, error: msg };
  }
}
