import { pgTable, uuid, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { folders } from "./folders";

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull().default("Catatan tanpa judul"),
  content: jsonb("content"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;