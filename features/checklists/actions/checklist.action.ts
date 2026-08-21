"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { checklistService } from "@/features/checklists/services/checklist.service";
import type { ActionResult } from "@/types/api";
import type { Checklist, ChecklistItem } from "@/lib/db/schema";

export async function createChecklistAction(
  title: string,
  folderId?: string,
  deadline?: string
): Promise<ActionResult<Checklist>> {
  await requireAuth();
  try {
    const cl = await checklistService.create(
      title,
      folderId,
      deadline ? new Date(deadline) : null
    );
    revalidatePath("/checklists");
    revalidatePath("/dashboard");
    return { success: true, data: cl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat checklist.";
    return { success: false, error: message };
  }
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

export async function updateChecklistDeadlineAction(
  id: string,
  deadline: string | null
): Promise<ActionResult<Checklist>> {
  await requireAuth();
  try {
    const updated = await checklistService.update(id, {
      deadline: deadline ? new Date(deadline) : null,
    });
    revalidatePath("/checklists");
    revalidatePath(`/checklists/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui deadline tugas.";
    return { success: false, error: message };
  }
}

export async function deleteChecklistAction(id: string, redirectTo?: string): Promise<void> {
  await requireAuth();
  await checklistService.delete(id);
  revalidatePath("/checklists");
  revalidatePath("/folders");
  revalidatePath("/dashboard");
  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function addChecklistItemAction(
  checklistId: string,
  content: string,
  deadline?: string
): Promise<ActionResult<ChecklistItem>> {
  await requireAuth();
  try {
    const item = await checklistService.addItem(
      checklistId,
      content,
      deadline ? new Date(deadline) : null
    );
    revalidatePath(`/checklists/${checklistId}`);
    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan item.";
    return { success: false, error: message };
  }
}

export async function toggleChecklistItemAction(itemId: string, isDone: boolean, checklistId: string): Promise<ActionResult<ChecklistItem>> {
  await requireAuth();
  try {
    const item = await checklistService.toggleItem(itemId, isDone);
    revalidatePath(`/checklists/${checklistId}`);
    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Gagal mengubah status item." };
  }
}

export async function deleteChecklistItemAction(itemId: string, checklistId: string): Promise<ActionResult> {
  await requireAuth();
  try {
    await checklistService.deleteItem(itemId);
    revalidatePath(`/checklists/${checklistId}`);
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Gagal menghapus item." };
  }
}
