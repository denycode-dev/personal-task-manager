import { db } from "@/lib/db";
import { folderShares, type FolderShare, type NewFolderShare } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export const folderShareRepository = {
  async findByFolderId(folderId: string): Promise<FolderShare | null> {
    const rows = await db
      .select()
      .from(folderShares)
      .where(eq(folderShares.folderId, folderId))
      .limit(1);
    return rows[0] ?? null;
  },

  async findByFolderIds(folderIds: string[]): Promise<FolderShare[]> {
    if (folderIds.length === 0) return [];
    return db
      .select()
      .from(folderShares)
      .where(inArray(folderShares.folderId, folderIds));
  },

  async findBySlug(slug: string): Promise<FolderShare | null> {
    const rows = await db
      .select()
      .from(folderShares)
      .where(eq(folderShares.publicSlug, slug))
      .limit(1);
    return rows[0] ?? null;
  },

  async findAll(): Promise<FolderShare[]> {
    return db.select().from(folderShares);
  },

  async create(data: NewFolderShare): Promise<FolderShare> {
    const rows = await db
      .insert(folderShares)
      .values(data)
      .returning();
    return rows[0];
  },

  async delete(folderId: string): Promise<void> {
    await db.delete(folderShares).where(eq(folderShares.folderId, folderId));
  },
};
