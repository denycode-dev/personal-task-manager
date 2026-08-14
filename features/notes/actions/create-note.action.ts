"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createNoteSchema } from "@/features/notes/schemas/note.schema";
import { noteService } from "@/features/notes/services/note.service";
import type { ActionResult } from "@/types/api";
import type { Note } from "@/lib/db/schema";

export async function createNoteAction(
  input: unknown
): Promise<ActionResult<Note>> {
  await requireAuth();

  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Data tidak valid." };
  }

  const note = await noteService.create(parsed.data);
  revalidatePath("/notes");
  return { success: true, data: note };
}