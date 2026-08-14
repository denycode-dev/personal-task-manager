import { deadlineRepository } from "@/features/deadlines/repositories/deadline.repository";
import { getDeadlineStatus } from "@/lib/utils/date";
import type { UpcomingDeadline } from "@/features/deadlines/types";

// 48 hours = H-1 window
const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000;

export const deadlineService = {
  async getUpcomingDeadlines(): Promise<UpcomingDeadline[]> {
    const [kanbanCards, checklistItems] = await Promise.all([
      deadlineRepository.getUpcomingKanbanCards(UPCOMING_WINDOW_MS),
      deadlineRepository.getUpcomingChecklistItems(UPCOMING_WINDOW_MS),
    ]);

    const fromKanban: UpcomingDeadline[] = kanbanCards
      .filter((c) => c.deadline)
      .map((c) => ({
        id: c.id,
        sourceId: c.id,
        source: "kanban",
        title: c.title,
        deadline: c.deadline!,
        status: getDeadlineStatus(c.deadline),
      }));

    const fromChecklist: UpcomingDeadline[] = checklistItems
      .filter((i) => i.deadline)
      .map((i) => ({
        id: i.id,
        sourceId: i.id,
        source: "checklist",
        title: i.title,
        deadline: i.deadline!,
        status: getDeadlineStatus(i.deadline),
      }));

    return [...fromKanban, ...fromChecklist].sort(
      (a, b) => a.deadline.getTime() - b.deadline.getTime()
    );
  },

  async getOverdueCount(): Promise<number> {
    const upcoming = await deadlineService.getUpcomingDeadlines();
    return upcoming.filter((d) => d.status === "overdue" || d.status === "today").length;
  },
};