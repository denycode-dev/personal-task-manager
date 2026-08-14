import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { notes } from "./notes";

export const noteShares = pgTable("note_shares", {
  noteId: uuid("note_id").primaryKey().references(() => notes.id, { onDelete: "cascade" }),
  publicSlug: varchar("public_slug", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type NoteShare = typeof noteShares.$inferSelect;
export type NewNoteShare = typeof noteShares.$inferInsert;