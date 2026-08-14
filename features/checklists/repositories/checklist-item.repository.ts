import { db } from "@/lib/db";
import { checklistItems, type ChecklistItem, type NewChecklistItem } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const checklistItemRepository = {
  async findByChecklistId(checklistId: string): Promise<ChecklistItem[]> {
    return db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.checklistId, checklistId))
      .orderBy(asc(checklistItems.position));
  },

  async create(data: Omit<NewChecklistItem, "id" | "createdAt" | "updatedAt">): Promise<ChecklistItem> {
    const [item] = await db.insert(checklistItems).values(data).returning();
    return item;
  },

  async toggle(id: string, isDone: boolean): Promise<ChecklistItem | undefined> {
    const [item] = await db
      .update(checklistItems)
      .set({ isDone, updatedAt: new Date() })
      .where(eq(checklistItems.id, id))
      .returning();
    return item;
  },

  async delete(id: string): Promise<void> {
    await db.delete(checklistItems).where(eq(checklistItems.id, id));
  },
};