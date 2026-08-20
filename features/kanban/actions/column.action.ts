"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { columnService } from "@/features/kanban/services/column.service";
import type { ActionResult } from "@/types/api";
import type { KanbanColumn } from "@/lib/db/schema";

import { reorderColumnsSchema } from "@/features/kanban/schemas";

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

export async function reorderColumnsAction(boardId: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = reorderColumnsSchema.safeParse(
      Array.isArray(input) ? { items: input } : input
    );
    if (!parsed.success) {
      return { success: false, error: "Format urutan kolom tidak valid." };
    }
    await columnService.reorder(parsed.data.items);
    revalidatePath(`/kanban/${boardId}`);
    return { success: true, data: undefined };
  } catch (err: any) {
    console.error("reorderColumnsAction error:", err);
    return { success: false, error: err?.message || "Gagal memindahkan kolom." };
  }
}
