import { db } from "@/lib/db";
import { timelineEvents, type TimelineEvent, type NewTimelineEvent } from "@/lib/db/schema";
import { eq, gte, lte, and } from "drizzle-orm";

export const timelineRepository = {
  async findInRange(start: Date, end: Date): Promise<TimelineEvent[]> {
    return db
      .select()
      .from(timelineEvents)
      .where(and(gte(timelineEvents.startAt, start), lte(timelineEvents.startAt, end)));
  },

  async create(data: Omit<NewTimelineEvent, "id" | "createdAt" | "updatedAt">): Promise<TimelineEvent> {
    const [event] = await db.insert(timelineEvents).values(data).returning();
    return event;
  },

  async delete(id: string): Promise<void> {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  },
};