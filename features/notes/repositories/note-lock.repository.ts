import { db } from "@/lib/db";
import { noteLocks, type NoteLock, type NewNoteLock } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const noteLockRepository = {
  async findByNoteId(noteId: string): Promise<NoteLock | undefined> {
    const [lock] = await db
      .select()
      .from(noteLocks)
      .where(eq(noteLocks.noteId, noteId));
    return lock;
  },

  async create(data: NewNoteLock): Promise<NoteLock> {
    const [lock] = await db.insert(noteLocks).values(data).returning();
    return lock;
  },

  async updatePasswordHash(
    noteId: string,
    passwordHash: string
  ): Promise<NoteLock | undefined> {
    const [lock] = await db
      .update(noteLocks)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(noteLocks.noteId, noteId))
      .returning();
    return lock;
  },

  async updateEncryptedContent(
    noteId: string,
    data: {
      contentCiphertext: string;
      contentIv: string;
      contentAuthTag: string;
      dekWrapped: string;
      dekWrapIv: string;
      dekWrapAuthTag: string;
    }
  ): Promise<NoteLock | undefined> {
    const [lock] = await db
      .update(noteLocks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(noteLocks.noteId, noteId))
      .returning();
    return lock;
  },

  async delete(noteId: string): Promise<void> {
    await db.delete(noteLocks).where(eq(noteLocks.noteId, noteId));
  },
};
