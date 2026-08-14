import { z } from "zod";

export const createChecklistSchema = z.object({
  title: z.string().min(1).max(255).default("Checklist tanpa judul"),
  folderId: z.string().uuid().optional().nullable(),
});

export const createChecklistItemSchema = z.object({
  checklistId: z.string().uuid(),
  content: z.string().min(1).max(500),
  deadline: z.string().datetime().optional().nullable(),
  position: z.number().int().min(0),
});

export const toggleChecklistItemSchema = z.object({
  isDone: z.boolean(),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;