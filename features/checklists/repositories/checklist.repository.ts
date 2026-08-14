import { db } from "@/lib/db";
import { checklists, type Checklist, type NewChecklist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const checklistRepository = {
  async findAll(): Promise<Checklist[]> {
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

  async delete(id: string): Promise<void> {
    await db.delete(checklists).where(eq(checklists.id, id));
  },
};