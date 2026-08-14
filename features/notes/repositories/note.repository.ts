import { db } from "@/lib/db";
import { notes, type Note, type NewNote } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";

export const noteRepository = {
  async findAll(folderId?: string | null): Promise<Note[]> {
    if (folderId === null) {
      return db
        .select()
        .from(notes)
        .where(isNull(notes.folderId))
        .orderBy(desc(notes.updatedAt));
    }
    if (folderId !== undefined) {
      return db
        .select()
        .from(notes)
        .where(eq(notes.folderId, folderId))
        .orderBy(desc(notes.updatedAt));
    }
    return db.select().from(notes).orderBy(desc(notes.updatedAt));
  },

  async findById(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  },

  async create(data: Omit<NewNote, "id" | "createdAt" | "updatedAt">): Promise<Note> {
    const [note] = await db.insert(notes).values(data).returning();
    return note;
  },

  async update(id: string, data: Partial<NewNote>): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return note;
  },

  async delete(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  },
};