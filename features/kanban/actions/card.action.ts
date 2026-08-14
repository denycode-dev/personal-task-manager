"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createCardSchema, reorderSchema } from "@/features/kanban/schemas";
import { cardService } from "@/features/kanban/services/card.service";
import type { ActionResult } from "@/types/api";
import type { KanbanCard } from "@/lib/db/schema";

export async function createCardAction(input: unknown): Promise<ActionResult<KanbanCard>> {
  try {
    await requireAuth();
    const parsed = createCardSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Data tidak valid." };
    const card = await cardService.create({
      columnId: parsed.data.columnId,
      title: parsed.data.title,
      description: parsed.data.description,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    });
    return { success: true, data: card };
  } catch (err: any) {
    console.error("createCardAction error:", err);
    return { success: false, error: err?.message || "Gagal membuat kartu." };
  }
}

export async function updateCardAction(id: string, input: { title?: string; description?: string | null; deadline?: string | null; columnId?: string; position?: number }): Promise<ActionResult<KanbanCard>> {
  try {
    await requireAuth();
    const card = await cardService.update(id, {
      ...input,
      deadline: input.deadline ? new Date(input.deadline) : input.deadline === null ? null : undefined,
    });
    return { success: true, data: card };
  } catch (err: any) {
    console.error("updateCardAction error:", err);
    return { success: false, error: err?.message || "Gagal memperbarui kartu." };
  }
}

export async function deleteCardAction(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await cardService.delete(id);
    return { success: true, data: undefined };
  } catch (err: any) {
    console.error("deleteCardAction error:", err);
    return { success: false, error: err?.message || "Gagal menghapus kartu." };
  }
}

export async function reorderCardsAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = reorderSchema.safeParse(
      Array.isArray(input) ? { items: input } : input
    );
    if (!parsed.success) {
      return { success: false, error: "Format urutan kartu tidak valid." };
    }
    await cardService.reorder(parsed.data.items);
    return { success: true, data: undefined };
  } catch (err: any) {
    console.error("reorderCardsAction error:", err);
    return { success: false, error: err?.message || "Gagal memindahkan kartu." };
  }
}
