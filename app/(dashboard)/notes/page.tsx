export const dynamic = "force-dynamic";

import { noteService } from "@/features/notes/services/note.service";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { NotesExplorer } from "@/features/notes/components/notes-explorer";
import { extractPlainText } from "@/features/notes/utils/reading-utils";
import { db } from "@/lib/db";
import { noteLocks, noteShares } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import type { EnrichedNote } from "@/features/notes/types/note.types";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    folderId?: string;
    q?: string;
    sort?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const { folderId, q, sort, status, view } = await searchParams;
  const [notes, folders] = await Promise.all([
    noteService.getAll(),
    folderRepository.findAll(),
  ]);

  const noteIds = notes.map((n) => n.id);
  const [lockedRows, sharedRows] = noteIds.length > 0
    ? await Promise.all([
        db.select({ noteId: noteLocks.noteId }).from(noteLocks).where(inArray(noteLocks.noteId, noteIds)).catch(() => []),
        db.select({ noteId: noteShares.noteId }).from(noteShares).where(inArray(noteShares.noteId, noteIds)).catch(() => []),
      ])
    : [[], []];

  const lockedSet = new Set(lockedRows.map((r) => r.noteId));
  const sharedSet = new Set(sharedRows.map((r) => r.noteId));

  const enrichedNotes: EnrichedNote[] = notes.map((note) => {
    const rawSnippet = extractPlainText(note.content);
    // Normalize newlines and excess whitespace into a single clean preview line/paragraph
    const snippet = rawSnippet.replace(/\s+/g, " ").trim();
    return {
      ...note,
      isLocked: lockedSet.has(note.id),
      isShared: sharedSet.has(note.id),
      snippet,
    };
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <NotesExplorer
        initialNotes={enrichedNotes}
        folders={folders}
        initialFolderId={folderId}
        initialQuery={q}
        initialSort={sort}
        initialStatus={status}
        initialView={view}
      />
    </div>
  );
}

