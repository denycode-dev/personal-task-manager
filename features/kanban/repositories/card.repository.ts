import { db } from "@/lib/db";
import { kanbanCards, type KanbanCard, type NewKanbanCard } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export const cardRepository = {
  async findByColumnId(columnId: string): Promise<KanbanCard[]> {
    return db.select().from(kanbanCards)
      .where(eq(kanbanCards.columnId, columnId))
      .orderBy(asc(kanbanCards.position));
  },
  async findById(id: string): Promise<KanbanCard | undefined> {
    const [card] = await db.select().from(kanbanCards).where(eq(kanbanCards.id, id));
    return card;
  },
  async create(data: Omit<NewKanbanCard, "id" | "createdAt" | "updatedAt">): Promise<KanbanCard> {
    const [card] = await db.insert(kanbanCards).values(data).returning();
    return card;
  },
  async update(id: string, data: Partial<NewKanbanCard>): Promise<KanbanCard | undefined> {
    const [card] = await db.update(kanbanCards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(kanbanCards.id, id))
      .returning();
    return card;
  },
  async delete(id: string): Promise<void> {
    await db.delete(kanbanCards).where(eq(kanbanCards.id, id));
  },
  async bulkUpdatePositions(items: { id: string; position: number; columnId?: string }[]): Promise<void> {
    if (items.length === 0) return;
    await Promise.all(
      items.map(({ id, position, columnId }) =>
        db.update(kanbanCards)
          .set({
            position,
            ...(columnId ? { columnId } : {}),
            updatedAt: new Date(),
          })
          .where(eq(kanbanCards.id, id))
      )
    );
  },
};
