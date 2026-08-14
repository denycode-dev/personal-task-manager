import { db } from "@/lib/db";
import { folders, type Folder, type NewFolder } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const folderRepository = {
  async findAll(): Promise<Folder[]> {
    return db.select().from(folders).orderBy(folders.createdAt);
  },

  async findById(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder;
  },

  async create(data: Omit<NewFolder, "id" | "createdAt" | "updatedAt">): Promise<Folder> {
    const [folder] = await db.insert(folders).values(data).returning();
    return folder;
  },

  async update(id: string, data: Partial<NewFolder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(folders.id, id))
      .returning();
    return folder;
  },

  async delete(id: string): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  },
};