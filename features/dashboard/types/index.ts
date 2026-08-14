import type { UpcomingDeadline } from "@/features/deadlines/types";
export type { UpcomingDeadline };

export interface FolderBadgeInfo {
  id: string;
  name: string;
  color: string;
}

export interface DashboardStats {
  totalNotes: number;
  totalBoards: number;
  totalCards: number;
  totalFolders: number;
  checklistTotal: number;
  checklistDone: number;
  checklistPending: number;
  checklistCompletionRate: number; // 0 to 100
  urgentDeadlinesCount: number;
  overdueCount: number;
  todayCount: number;
  tomorrowCount: number;
}

export interface RecentNoteSummary {
  id: string;
  title: string;
  updatedAt: Date;
  isLocked: boolean;
  folder?: FolderBadgeInfo | null;
}

export interface BoardColumnSummary {
  id: string;
  name: string;
  color?: string | null;
  cardCount: number;
}

export interface ActiveBoardSummary {
  id: string;
  title: string;
  columnsCount: number;
  cardsCount: number;
  columns: BoardColumnSummary[];
  folder?: FolderBadgeInfo | null;
  updatedAt: Date;
}

export interface ChecklistItemSummary {
  id: string;
  content: string;
  isDone: boolean;
  deadline?: Date | null;
}

export interface ChecklistSummary {
  id: string;
  title: string;
  totalItems: number;
  completedItems: number;
  completionRate: number; // 0 to 100
  items: ChecklistItemSummary[];
  folder?: FolderBadgeInfo | null;
  updatedAt: Date;
}

export interface DashboardOverviewData {
  greeting: string;
  formattedDate: string;
  stats: DashboardStats;
  upcomingDeadlines: UpcomingDeadline[];
  recentNotes: RecentNoteSummary[];
  activeBoards: ActiveBoardSummary[];
  recentChecklists: ChecklistSummary[];
}
