"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { createBoardSchema } from "@/features/kanban/schemas";
import { boardService } from "@/features/kanban/services/board.service";
import type { ActionResult } from "@/types/api";
import type { KanbanBoard } from "@/lib/db/schema";

export async function createBoardAction(input: unknown): Promise<ActionResult<KanbanBoard>> {
  await requireAuth();
  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Data tidak valid." };
  const board = await boardService.create(parsed.data);
  revalidatePath("/kanban");
  return { success: true, data: board };
}

export async function deleteBoardAction(id: string): Promise<void> {
  await requireAuth();
  await boardService.delete(id);
  revalidatePath("/kanban");
  redirect("/kanban");
}
