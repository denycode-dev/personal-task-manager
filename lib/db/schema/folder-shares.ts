import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { folders } from "./folders";

export const folderShares = pgTable("folder_shares", {
  folderId: uuid("folder_id")
    .primaryKey()
    .references(() => folders.id, { onDelete: "cascade" }),
  publicSlug: varchar("public_slug", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type FolderShare = typeof folderShares.$inferSelect;
export type NewFolderShare = typeof folderShares.$inferInsert;
