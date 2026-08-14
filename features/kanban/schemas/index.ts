import { z } from "zod";

export const createBoardSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi.").max(255).default("Papan tanpa judul"),
  folderId: z.string().uuid().optional().nullable(),
});

export const createColumnSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  position: z.number().int().min(0),
});

export const createCardSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  position: z.number().int().min(0),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
      columnId: z.string().uuid().optional(),
    })
  ),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;