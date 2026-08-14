import { pgTable, uuid, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { kanbanCards } from "./kanban-cards";

export const kanbanCardAttachments = pgTable("kanban_card_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id").notNull().references(() => kanbanCards.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  imagekitFileId: text("imagekit_file_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type KanbanCardAttachment = typeof kanbanCardAttachments.$inferSelect;
export type NewKanbanCardAttachment = typeof kanbanCardAttachments.$inferInsert;

export const kanbanCardAttachmentsRelations = relations(kanbanCardAttachments, ({ one }) => ({
  card: one(kanbanCards, {
    fields: [kanbanCardAttachments.cardId],
    references: [kanbanCards.id],
  }),
}));