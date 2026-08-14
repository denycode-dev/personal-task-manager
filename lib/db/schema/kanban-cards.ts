import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { kanbanCardAttachments } from "./kanban-attachments";
import { kanbanColumns } from "./kanban-columns";

export const kanbanCards = pgTable("kanban_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  columnId: uuid("column_id").notNull().references(() => kanbanColumns.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadline: timestamp("deadline", { withTimezone: true }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type KanbanCard = typeof kanbanCards.$inferSelect;
export type NewKanbanCard = typeof kanbanCards.$inferInsert;

export const kanbanCardsRelations = relations(kanbanCards, ({ one, many }) => ({
  column: one(kanbanColumns, {
    fields: [kanbanCards.columnId],
    references: [kanbanColumns.id],
  }),
  attachments: many(kanbanCardAttachments),
}));