import { db } from "@/lib/db";
import { kanbanCards, checklistItems, checklists } from "@/lib/db/schema";
import { isNotNull, lte, and, eq } from "drizzle-orm";

export const deadlineRepository = {
  async getUpcomingKanbanCards(withinMs: number) {
    const cutoff = new Date(Date.now() + withinMs);
    return db
      .select({
        id: kanbanCards.id,
        title: kanbanCards.title,
        deadline: kanbanCards.deadline,
      })
      .from(kanbanCards)
      .where(and(isNotNull(kanbanCards.deadline), lte(kanbanCards.deadline, cutoff)));
  },

  async getUpcomingChecklistItems(withinMs: number) {
    const cutoff = new Date(Date.now() + withinMs);
    return db
      .select({
        id: checklistItems.id,
        title: checklistItems.content,
        deadline: checklistItems.deadline,
        isDone: checklistItems.isDone,
      })
      .from(checklistItems)
      .where(
        and(
          isNotNull(checklistItems.deadline),
          lte(checklistItems.deadline, cutoff),
          eq(checklistItems.isDone, false)
        )
      );
  },

  async getUpcomingChecklists(withinMs: number) {
    const cutoff = new Date(Date.now() + withinMs);
    return db
      .select({
        id: checklists.id,
        title: checklists.title,
        deadline: checklists.deadline,
      })
      .from(checklists)
      .where(and(isNotNull(checklists.deadline), lte(checklists.deadline, cutoff)));
  },
};