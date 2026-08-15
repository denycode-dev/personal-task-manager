import { db } from "@/lib/db";
import { kanbanBoards, kanbanColumns, kanbanCards, type KanbanBoard } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

export const boardRepository = {
  async findAll(folderId?: string): Promise<KanbanBoard[]> {
    if (folderId === "none") {
      return db
        .select()
        .from(kanbanBoards)
        .where(isNull(kanbanBoards.folderId))
        .orderBy(kanbanBoards.createdAt);
    }
    if (folderId) {
      return db
        .select()
        .from(kanbanBoards)
        .where(eq(kanbanBoards.folderId, folderId))
        .orderBy(kanbanBoards.createdAt);
    }
    return db.select().from(kanbanBoards).orderBy(kanbanBoards.createdAt);
  },

  async findById(id: string): Promise<KanbanBoard | undefined> {
    const [board] = await db.select().from(kanbanBoards).where(eq(kanbanBoards.id, id));
    return board;
  },

  async create(data: { title: string; folderId?: string | null }): Promise<KanbanBoard> {
    const [board] = await db.insert(kanbanBoards).values(data).returning();
    return board;
  },

  async update(id: string, data: Partial<KanbanBoard>): Promise<KanbanBoard | undefined> {
    const [board] = await db
      .update(kanbanBoards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(kanbanBoards.id, id))
      .returning();
    return board;
  },

  async delete(id: string): Promise<void> {
    await db.delete(kanbanBoards).where(eq(kanbanBoards.id, id));
  },
};