import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi.").max(255).default("Catatan tanpa judul"),
  content: z.unknown().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;