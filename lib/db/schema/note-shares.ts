import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { notes } from "./notes";

export const noteShares = pgTable("note_shares", {
  noteId: uuid("note_id").primaryKey().references(() => notes.id, { onDelete: "cascade" }),
  publicSlug: varchar("public_slug", { length: 16 }).notNull().unique(),
  isEditable: boolean("is_editable").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type NoteShare = typeof noteShares.$inferSelect;
export type NewNoteShare = typeof noteShares.$inferInsert;