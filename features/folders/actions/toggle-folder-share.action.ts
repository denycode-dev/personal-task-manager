"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { folderShareService } from "@/features/folders/services/folder-share.service";
import type { ActionResult } from "@/types/api";

export async function toggleShareFolderAction(
  folderId: string,
  enable: boolean
): Promise<ActionResult<{ isShared: boolean; publicSlug: string | null }>> {
  await requireAuth();

  try {
    if (enable) {
      const result = await folderShareService.enableShare(folderId);
      revalidatePath("/notes");
      revalidatePath("/folders");
      return {
        success: true,
        data: {
          isShared: true,
          publicSlug: result.publicSlug,
        },
      };
    } else {
      await folderShareService.disableShare(folderId);
      revalidatePath("/notes");
      revalidatePath("/folders");
      return {
        success: true,
        data: {
          isShared: false,
          publicSlug: null,
        },
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengubah status berbagi folder.";
    return { success: false, error: message };
  }
}
