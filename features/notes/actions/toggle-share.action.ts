"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { noteShareService } from "@/features/notes/services/note-share.service";
import type { ActionResult } from "@/types/api";

export async function toggleShareNoteAction(
  noteId: string,
  enable: boolean,
  isEditable: boolean = false
): Promise<ActionResult<{ isShared: boolean; publicSlug: string | null; isEditable: boolean }>> {
  await requireAuth();

  if (enable) {
    const result = await noteShareService.enableShare(noteId, isEditable);
    revalidatePath(`/notes/${noteId}`);
    return {
      success: true,
      data: {
        isShared: true,
        publicSlug: result.publicSlug,
        isEditable: result.isEditable,
      },
    };
  } else {
    await noteShareService.disableShare(noteId);
    revalidatePath(`/notes/${noteId}`);
    return {
      success: true,
      data: { isShared: false, publicSlug: null, isEditable: false },
    };
  }
}

export async function updateSharePermissionAction(
  noteId: string,
  isEditable: boolean
): Promise<ActionResult<{ isEditable: boolean }>> {
  await requireAuth();

  try {
    const result = await noteShareService.updateSharePermission(noteId, isEditable);
    revalidatePath(`/notes/${noteId}`);
    return {
      success: true,
      data: { isEditable: result.isEditable },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui izin bagikan.";
    return { success: false, error: message };
  }
}
