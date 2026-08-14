import { db } from "@/lib/db";
import { kanbanCards, checklistItems, timelineEvents } from "@/lib/db/schema";
import { gte, lte, and, or, isNotNull } from "drizzle-orm";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: { type: "kanban" | "checklist" | "timeline"; url?: string; description?: string };
};

export const calendarService = {
  async getEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
    const [cards, items, events] = await Promise.all([
      db.select({ id: kanbanCards.id, title: kanbanCards.title, deadline: kanbanCards.deadline })
        .from(kanbanCards)
        .where(and(isNotNull(kanbanCards.deadline), gte(kanbanCards.deadline, start), lte(kanbanCards.deadline, end))),
      db.select({ id: checklistItems.id, content: checklistItems.content, deadline: checklistItems.deadline, isDone: checklistItems.isDone })
        .from(checklistItems)
        .where(and(isNotNull(checklistItems.deadline), gte(checklistItems.deadline, start), lte(checklistItems.deadline, end))),
      db.select().from(timelineEvents)
        .where(
          or(
            and(gte(timelineEvents.startAt, start), lte(timelineEvents.startAt, end)),
            and(isNotNull(timelineEvents.endAt), gte(timelineEvents.endAt, start), lte(timelineEvents.startAt, end))
          )
        ),
    ]);

    const result: CalendarEvent[] = [];

    for (const c of cards) {
      if (!c.deadline) continue;
      result.push({
        id: `kanban-${c.id}`,
        title: c.title,
        start: c.deadline.toISOString(),
        backgroundColor: "#4361EE",
        borderColor: "#000000",
        textColor: "#FFFFFF",
        extendedProps: { type: "kanban", url: `/kanban` },
      });
    }

    for (const i of items) {
      if (!i.deadline) continue;
      result.push({
        id: `checklist-${i.id}`,
        title: i.content + (i.isDone ? " ✓" : ""),
        start: i.deadline.toISOString(),
        backgroundColor: "#06D6A0",
        borderColor: "#000000",
        textColor: "#000000",
        extendedProps: { type: "checklist", url: `/checklists` },
      });
    }

    for (const e of events) {
      result.push({
        id: `timeline-${e.id}`,
        title: e.title,
        start: e.startAt.toISOString(),
        end: e.endAt ? e.endAt.toISOString() : undefined,
        backgroundColor: e.color || "#F72585",
        borderColor: "#000000",
        textColor: "#FFFFFF",
        extendedProps: {
          type: "timeline",
          description: e.description ?? undefined,
        },
      });
    }

    return result;
  },
};
