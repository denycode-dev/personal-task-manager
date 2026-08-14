import { db } from "@/lib/db";
import { kanbanColumns, type KanbanColumn, type NewKanbanColumn } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const columnRepository = {
  async findByBoardId(boardId: string): Promise<KanbanColumn[]> {
    return db.select().from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(asc(kanbanColumns.position));
  },
  async create(data: Omit<NewKanbanColumn, "id" | "createdAt">): Promise<KanbanColumn> {
    const [col] = await db.insert(kanbanColumns).values(data).returning();
    return col;
  },
  async update(id: string, data: Partial<NewKanbanColumn>): Promise<KanbanColumn | undefined> {
    const [col] = await db.update(kanbanColumns).set(data).where(eq(kanbanColumns.id, id)).returning();
    return col;
  },
  async delete(id: string): Promise<void> {
    await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
  },
};
