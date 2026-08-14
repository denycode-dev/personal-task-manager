"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createFolderSchema, updateFolderSchema } from "@/features/folders/schemas/folder.schema";
import { folderService } from "@/features/folders/services/folder.service";
import type { ActionResult } from "@/types/api";
import type { Folder } from "@/lib/db/schema";

export async function createFolderAction(input: unknown): Promise<ActionResult<Folder>> {
  await requireAuth();
  const parsed = createFolderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Data tidak valid." };
  const folder = await folderService.create(parsed.data);
  revalidatePath("/folders");
  return { success: true, data: folder };
}

export async function updateFolderAction(id: string, input: unknown): Promise<ActionResult<Folder>> {
  await requireAuth();
  const parsed = updateFolderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Data tidak valid." };
  const folder = await folderService.update(id, parsed.data);
  revalidatePath("/folders");
  return { success: true, data: folder };
}

export async function deleteFolderAction(id: string): Promise<ActionResult> {
  await requireAuth();
  await folderService.delete(id);
  revalidatePath("/folders");
  return { success: true, data: undefined };
}
