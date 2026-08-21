"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { noteService } from "@/features/notes/services/note.service";
import { z } from "zod";
import type { ActionResult } from "@/types/api";
import type { Note } from "@/lib/db/schema";

const importNoteItemSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi.").max(255).default("Catatan tanpa judul"),
  content: z.unknown().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

const importNotesSchema = z.array(importNoteItemSchema);

export async function importNotesAction(
  input: unknown
): Promise<ActionResult<{ count: number; notes: Note[] }>> {
  await requireAuth();

  const parsed = importNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Format data catatan tidak valid." };
  }

  if (parsed.data.length === 0) {
    return { success: false, error: "Tidak ada catatan untuk diimpor." };
  }

  try {
    const createdNotes = await noteService.createMany(parsed.data);
    revalidatePath("/notes");
    revalidatePath("/folders");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        count: createdNotes.length,
        notes: createdNotes,
      },
    };
  } catch (err) {
    console.error("Error importing notes:", err);
    return {
      success: false,
      error: "Gagal menyimpan catatan yang diimpor ke database.",
    };
  }
}
