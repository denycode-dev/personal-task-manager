import { db } from "@/lib/db";
import { notes, kanbanBoards, checklists, folders } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";

export const searchRepository = {
  async search(query: string) {
    const pattern = `%${query}%`;

    const [foundNotes, foundBoards, foundChecklists, foundFolders] =
      await Promise.all([
        db
          .select({ id: notes.id, title: notes.title })
          .from(notes)
          .where(ilike(notes.title, pattern))
          .limit(10),
        db
          .select({ id: kanbanBoards.id, title: kanbanBoards.title })
          .from(kanbanBoards)
          .where(ilike(kanbanBoards.title, pattern))
          .limit(10),
        db
          .select({ id: checklists.id, title: checklists.title })
          .from(checklists)
          .where(ilike(checklists.title, pattern))
          .limit(10),
        db
          .select({ id: folders.id, name: folders.name })
          .from(folders)
          .where(ilike(folders.name, pattern))
          .limit(10),
      ]);

    return { foundNotes, foundBoards, foundChecklists, foundFolders };
  },
};