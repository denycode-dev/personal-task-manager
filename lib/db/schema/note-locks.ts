import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { notes } from "./notes";

export const noteLocks = pgTable("note_locks", {
  noteId: uuid("note_id").primaryKey().references(() => notes.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  contentCiphertext: text("content_ciphertext").notNull(),
  contentIv: text("content_iv").notNull(),
  contentAuthTag: text("content_auth_tag").notNull(),
  dekWrapped: text("dek_wrapped").notNull(),
  dekWrapIv: text("dek_wrap_iv").notNull(),
  dekWrapAuthTag: text("dek_wrap_auth_tag").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type NoteLock = typeof noteLocks.$inferSelect;
export type NewNoteLock = typeof noteLocks.$inferInsert;