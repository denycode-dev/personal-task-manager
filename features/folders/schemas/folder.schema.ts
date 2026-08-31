import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1, "Nama folder wajib diisi.").max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna tidak valid.")
    .default("#FFD500"),
  parentId: z
    .string()
    .uuid("ID folder induk tidak valid.")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, "Nama folder wajib diisi.").max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna tidak valid.")
    .optional(),
  parentId: z
    .string()
    .uuid("ID folder induk tidak valid.")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;