import type { Note } from "@/lib/db/schema";
import type { Folder } from "@/lib/db/schema";

export interface EnrichedNote extends Note {
  isLocked: boolean;
  isShared: boolean;
  snippet: string;
}

export type NoteSortOption =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc";

export type NoteStatusFilter = "all" | "locked" | "shared" | "normal";

export type NoteViewMode = "grid" | "list";
