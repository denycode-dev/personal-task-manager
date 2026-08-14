import { db } from "@/lib/db";
import {
  notes,
  noteLocks,
  folders,
  kanbanBoards,
  kanbanColumns,
  kanbanCards,
  checklists,
  checklistItems,
} from "@/lib/db/schema";
import { deadlineService } from "@/features/deadlines/services/deadline.service";
import { desc, eq, inArray, count, sql } from "drizzle-orm";
import type {
  DashboardOverviewData,
  DashboardStats,
  RecentNoteSummary,
  ActiveBoardSummary,
  ChecklistSummary,
  FolderBadgeInfo,
} from "@/features/dashboard/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 19) return "Selamat Sore";
  return "Selamat Malam";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export const dashboardService = {
  async getOverviewData(): Promise<DashboardOverviewData> {
    try {
      // 1. Fetch upcoming deadlines, folder maps, and basic counts in parallel
      const [
        upcomingDeadlines,
        allFolders,
        recentNotesRaw,
        totalNotesCountRes,
        allBoardsRaw,
        totalCardsCountRes,
        allChecklistsRaw,
        allChecklistItems,
      ] = await Promise.all([
        deadlineService.getUpcomingDeadlines().catch(() => []),
        db.select().from(folders).catch(() => []),
        db.select().from(notes).orderBy(desc(notes.updatedAt)).limit(5).catch(() => []),
        db.select({ count: count() }).from(notes).catch(() => [{ count: 0 }]),
        db.select().from(kanbanBoards).orderBy(desc(kanbanBoards.updatedAt)).limit(4).catch(() => []),
        db.select({ count: count() }).from(kanbanCards).catch(() => [{ count: 0 }]),
        db.select().from(checklists).orderBy(desc(checklists.updatedAt)).limit(4).catch(() => []),
        db.select().from(checklistItems).catch(() => []),
      ]);

      // Folders map for fast lookup
      const folderMap = new Map<string, FolderBadgeInfo>();
      for (const f of allFolders) {
        folderMap.set(f.id, { id: f.id, name: f.name, color: f.color });
      }

      // 2. Process Recent Notes (Check locked status)
      const noteIds = recentNotesRaw.map((n) => n.id);
      const lockedNoteIdsSet = new Set<string>();
      if (noteIds.length > 0) {
        const lockedRows = await db
          .select({ noteId: noteLocks.noteId })
          .from(noteLocks)
          .where(inArray(noteLocks.noteId, noteIds))
          .catch(() => []);
        lockedRows.forEach((l) => lockedNoteIdsSet.add(l.noteId));
      }

      const recentNotes: RecentNoteSummary[] = recentNotesRaw.map((n) => ({
        id: n.id,
        title: n.title,
        updatedAt: n.updatedAt,
        isLocked: lockedNoteIdsSet.has(n.id),
        folder: n.folderId ? folderMap.get(n.folderId) ?? null : null,
      }));

      // 3. Process Active Boards & Column Card Counts
      const boardIds = allBoardsRaw.map((b) => b.id);
      let columnsRaw: (typeof kanbanColumns.$inferSelect)[] = [];
      let cardsForBoards: { id: string; columnId: string }[] = [];

      if (boardIds.length > 0) {
        [columnsRaw, cardsForBoards] = await Promise.all([
          db
            .select()
            .from(kanbanColumns)
            .where(inArray(kanbanColumns.boardId, boardIds))
            .orderBy(kanbanColumns.position)
            .catch(() => []),
          db
            .select({ id: kanbanCards.id, columnId: kanbanCards.columnId })
            .from(kanbanCards)
            .catch(() => []),
        ]);
      }

      const cardCountByCol = new Map<string, number>();
      cardsForBoards.forEach((c) => {
        cardCountByCol.set(c.columnId, (cardCountByCol.get(c.columnId) ?? 0) + 1);
      });

      const colsByBoard = new Map<string, typeof columnsRaw>();
      columnsRaw.forEach((col) => {
        const existing = colsByBoard.get(col.boardId) ?? [];
        existing.push(col);
        colsByBoard.set(col.boardId, existing);
      });

      const activeBoards: ActiveBoardSummary[] = allBoardsRaw.map((b) => {
        const boardCols = colsByBoard.get(b.id) ?? [];
        let totalBoardCards = 0;
        const columns = boardCols.map((col) => {
          const cCount = cardCountByCol.get(col.id) ?? 0;
          totalBoardCards += cCount;
          return {
            id: col.id,
            name: col.name,
            color: col.color,
            cardCount: cCount,
          };
        });

        return {
          id: b.id,
          title: b.title,
          columnsCount: boardCols.length,
          cardsCount: totalBoardCards,
          columns,
          folder: b.folderId ? folderMap.get(b.folderId) ?? null : null,
          updatedAt: b.updatedAt,
        };
      });

      // 4. Process Checklists & Item Progress
      const itemsByChecklist = new Map<string, typeof allChecklistItems>();
      allChecklistItems.forEach((item) => {
        const existing = itemsByChecklist.get(item.checklistId) ?? [];
        existing.push(item);
        itemsByChecklist.set(item.checklistId, existing);
      });

      const recentChecklists: ChecklistSummary[] = allChecklistsRaw.map((cl) => {
        const items = itemsByChecklist.get(cl.id) ?? [];
        const completedCount = items.filter((i) => i.isDone).length;
        const total = items.length;
        const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        return {
          id: cl.id,
          title: cl.title,
          totalItems: total,
          completedItems: completedCount,
          completionRate,
          items: items.slice(0, 4).map((i) => ({
            id: i.id,
            content: i.content,
            isDone: i.isDone,
            deadline: i.deadline,
          })),
          folder: cl.folderId ? folderMap.get(cl.folderId) ?? null : null,
          updatedAt: cl.updatedAt,
        };
      });

      // Global Checklist Stats
      const totalChecklistItems = allChecklistItems.length;
      const doneChecklistItems = allChecklistItems.filter((i) => i.isDone).length;
      const pendingChecklistItems = totalChecklistItems - doneChecklistItems;
      const globalChecklistRate =
        totalChecklistItems > 0
          ? Math.round((doneChecklistItems / totalChecklistItems) * 100)
          : 0;

      // Deadlines breakdown
      const overdueCount = upcomingDeadlines.filter((d) => d.status === "overdue").length;
      const todayCount = upcomingDeadlines.filter((d) => d.status === "today").length;
      const tomorrowCount = upcomingDeadlines.filter((d) => d.status === "tomorrow").length;

      const stats: DashboardStats = {
        totalNotes: Number(totalNotesCountRes[0]?.count ?? 0),
        totalBoards: allBoardsRaw.length,
        totalCards: Number(totalCardsCountRes[0]?.count ?? 0),
        totalFolders: allFolders.length,
        checklistTotal: totalChecklistItems,
        checklistDone: doneChecklistItems,
        checklistPending: pendingChecklistItems,
        checklistCompletionRate: globalChecklistRate,
        urgentDeadlinesCount: overdueCount + todayCount,
        overdueCount,
        todayCount,
        tomorrowCount,
      };

      return {
        greeting: getGreeting(),
        formattedDate: getFormattedDate(),
        stats,
        upcomingDeadlines,
        recentNotes,
        activeBoards,
        recentChecklists,
      };
    } catch (error) {
      console.error("[DashboardService] Error generating overview data:", error);
      return {
        greeting: getGreeting(),
        formattedDate: getFormattedDate(),
        stats: {
          totalNotes: 0,
          totalBoards: 0,
          totalCards: 0,
          totalFolders: 0,
          checklistTotal: 0,
          checklistDone: 0,
          checklistPending: 0,
          checklistCompletionRate: 0,
          urgentDeadlinesCount: 0,
          overdueCount: 0,
          todayCount: 0,
          tomorrowCount: 0,
        },
        upcomingDeadlines: [],
        recentNotes: [],
        activeBoards: [],
        recentChecklists: [],
      };
    }
  },
};
