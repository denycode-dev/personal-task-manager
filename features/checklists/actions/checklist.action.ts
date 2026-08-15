"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { checklistService } from "@/features/checklists/services/checklist.service";
import type { ActionResult } from "@/types/api";
import type { Checklist, ChecklistItem } from "@/lib/db/schema";

export async function createChecklistAction(title: string, folderId?: string): Promise<ActionResult<Checklist>> {
  await requireAuth();
  const cl = await checklistService.create(title, folderId);
  revalidatePath("/checklists");
  return { success: true, data: cl };
}

export async function updateChecklistFolderAction(
  id: string,
  folderId: string | null
): Promise<ActionResult<Checklist>> {
  await requireAuth();
  try {
    const updated = await checklistService.update(id, { folderId });
    revalidatePath("/checklists");
    revalidatePath(`/checklists/${id}`);
    revalidatePath("/folders");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Gagal memperbarui folder checklist." };
  }
}

export async function deleteChecklistAction(id: string): Promise<void> {
  await requireAuth();
  await checklistService.delete(id);
  revalidatePath("/checklists");
  redirect("/checklists");
}

export async function addChecklistItemAction(checklistId: string, content: string, deadline?: string): Promise<ActionResult<ChecklistItem>> {
  await requireAuth();
  const item = await checklistService.addItem(checklistId, content, deadline ? new Date(deadline) : null);
  revalidatePath(`/checklists/${checklistId}`);
  return { success: true, data: item };
}

export async function toggleChecklistItemAction(itemId: string, isDone: boolean, checklistId: string): Promise<ActionResult<ChecklistItem>> {
  await requireAuth();
  const item = await checklistService.toggleItem(itemId, isDone);
  revalidatePath(`/checklists/${checklistId}`);
  return { success: true, data: item };
}

export async function deleteChecklistItemAction(itemId: string, checklistId: string): Promise<ActionResult> {
  await requireAuth();
  await checklistService.deleteItem(itemId);
  revalidatePath(`/checklists/${checklistId}`);
  return { success: true, data: undefined };
}
