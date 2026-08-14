import { db } from "@/lib/db";
import { noteShares, type NoteShare, type NewNoteShare } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const noteShareRepository = {
  async findByNoteId(noteId: string): Promise<NoteShare | undefined> {
    const [share] = await db
      .select()
      .from(noteShares)
      .where(eq(noteShares.noteId, noteId));
    return share;
  },

  async findBySlug(slug: string): Promise<NoteShare | undefined> {
    const [share] = await db
      .select()
      .from(noteShares)
      .where(eq(noteShares.publicSlug, slug));
    return share;
  },

  async create(data: NewNoteShare): Promise<NoteShare> {
    const [share] = await db.insert(noteShares).values(data).returning();
    return share;
  },

  async delete(noteId: string): Promise<void> {
    await db.delete(noteShares).where(eq(noteShares.noteId, noteId));
  },
};
