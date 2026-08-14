"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { noteService } from "@/features/notes/services/note.service";

export async function deleteNoteAction(id: string): Promise<void> {
  await requireAuth();
  await noteService.delete(id);
  revalidatePath("/notes");
  redirect("/notes");
}