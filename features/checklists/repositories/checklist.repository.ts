import { db } from "@/lib/db";
import { checklists, type Checklist, type NewChecklist } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

export const checklistRepository = {
  async findAll(folderId?: string): Promise<Checklist[]> {
    if (folderId === "none") {
      return db
        .select()
        .from(checklists)
        .where(isNull(checklists.folderId))
        .orderBy(checklists.createdAt);
    }
    if (folderId) {
      return db
        .select()
        .from(checklists)
        .where(eq(checklists.folderId, folderId))
        .orderBy(checklists.createdAt);
    }
    return db.select().from(checklists).orderBy(checklists.createdAt);
  },

  async findById(id: string): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(eq(checklists.id, id));
    return checklist;
  },

  async create(data: Omit<NewChecklist, "id" | "createdAt" | "updatedAt">): Promise<Checklist> {
    const [checklist] = await db.insert(checklists).values(data).returning();
    return checklist;
  },

  async update(id: string, data: Partial<NewChecklist>): Promise<Checklist | undefined> {
    const [checklist] = await db
      .update(checklists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(checklists.id, id))
      .returning();
    return checklist;
  },

  async delete(id: string): Promise<void> {
    await db.delete(checklists).where(eq(checklists.id, id));
  },
};