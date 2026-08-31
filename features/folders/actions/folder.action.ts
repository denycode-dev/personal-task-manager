"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createFolderSchema, updateFolderSchema } from "@/features/folders/schemas/folder.schema";
import { folderService } from "@/features/folders/services/folder.service";
import type { ActionResult } from "@/types/api";
import type { Folder } from "@/lib/db/schema";

function revalidateAllFolderPaths() {
  revalidatePath("/folders");
  revalidatePath("/notes");
  revalidatePath("/kanban");
  revalidatePath("/checklists");
  revalidatePath("/dashboard");
}

export async function createFolderAction(input: unknown): Promise<ActionResult<Folder>> {
  try {
    await requireAuth();
    const parsed = createFolderSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data tidak valid.";
      return { success: false, error: errorMsg };
    }
    const folder = await folderService.create(parsed.data);
    revalidateAllFolderPaths();
    return { success: true, data: folder };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal membuat folder.";
    return { success: false, error: errorMsg };
  }
}

export async function updateFolderAction(id: string, input: unknown): Promise<ActionResult<Folder>> {
  try {
    await requireAuth();
    const parsed = updateFolderSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Data tidak valid.";
      return { success: false, error: errorMsg };
    }
    const folder = await folderService.update(id, parsed.data);
    revalidateAllFolderPaths();
    return { success: true, data: folder };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui folder.";
    return { success: false, error: errorMsg };
  }
}

export async function moveFolderAction(id: string, parentId: string | null): Promise<ActionResult<Folder>> {
  try {
    await requireAuth();
    const folder = await folderService.update(id, { parentId });
    revalidateAllFolderPaths();
    return { success: true, data: folder };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memindahkan folder.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteFolderAction(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await folderService.delete(id);
    revalidateAllFolderPaths();
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus folder.";
    return { success: false, error: errorMsg };
  }
}

