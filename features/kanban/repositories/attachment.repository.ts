import { db } from "@/lib/db";
import {
  kanbanCardAttachments,
  type KanbanCardAttachment,
  type NewKanbanCardAttachment,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const attachmentRepository = {
  async findByCardId(cardId: string): Promise<KanbanCardAttachment[]> {
    return db
      .select()
      .from(kanbanCardAttachments)
      .where(eq(kanbanCardAttachments.cardId, cardId))
      .orderBy(desc(kanbanCardAttachments.createdAt));
  },

  async findById(id: string): Promise<KanbanCardAttachment | null> {
    const rows = await db
      .select()
      .from(kanbanCardAttachments)
      .where(eq(kanbanCardAttachments.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async create(data: NewKanbanCardAttachment): Promise<KanbanCardAttachment> {
    const rows = await db
      .insert(kanbanCardAttachments)
      .values(data)
      .returning();
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await db
      .delete(kanbanCardAttachments)
      .where(eq(kanbanCardAttachments.id, id));
  },
};
