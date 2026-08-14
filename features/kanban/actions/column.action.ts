"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { columnService } from "@/features/kanban/services/column.service";
import type { ActionResult } from "@/types/api";
import type { KanbanColumn } from "@/lib/db/schema";

export async function createColumnAction(boardId: string, name: string, color?: string): Promise<ActionResult<KanbanColumn>> {
  await requireAuth();
  const col = await columnService.create(boardId, name, color);
  revalidatePath(`/kanban/${boardId}`);
  return { success: true, data: col };
}

export async function deleteColumnAction(boardId: string, columnId: string): Promise<ActionResult> {
  await requireAuth();
  await columnService.delete(columnId);
  revalidatePath(`/kanban/${boardId}`);
  return { success: true, data: undefined };
}
