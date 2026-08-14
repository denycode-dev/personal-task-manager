"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { noteShareService } from "@/features/notes/services/note-share.service";
import type { ActionResult } from "@/types/api";

export async function toggleShareNoteAction(
  noteId: string,
  enable: boolean
): Promise<ActionResult<{ isShared: boolean; publicSlug: string | null }>> {
  await requireAuth();

  if (enable) {
    const result = await noteShareService.enableShare(noteId);
    revalidatePath(`/notes/${noteId}`);
    return {
      success: true,
      data: { isShared: true, publicSlug: result.publicSlug },
    };
  } else {
    await noteShareService.disableShare(noteId);
    revalidatePath(`/notes/${noteId}`);
    return {
      success: true,
      data: { isShared: false, publicSlug: null },
    };
  }
}
