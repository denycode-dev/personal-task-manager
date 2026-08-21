import { deadlineRepository } from "@/features/deadlines/repositories/deadline.repository";
import { getDeadlineStatus } from "@/lib/utils/date";
import type { UpcomingDeadline } from "@/features/deadlines/types";

// 48 hours = H-1 window
const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000;

export const deadlineService = {
  async getUpcomingDeadlines(): Promise<UpcomingDeadline[]> {
    const [kanbanCards, checklistItems, checklistsList] = await Promise.all([
      deadlineRepository.getUpcomingKanbanCards(UPCOMING_WINDOW_MS),
      deadlineRepository.getUpcomingChecklistItems(UPCOMING_WINDOW_MS),
      deadlineRepository.getUpcomingChecklists(UPCOMING_WINDOW_MS),
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

    const fromChecklistItems: UpcomingDeadline[] = checklistItems
      .filter((i) => i.deadline)
      .map((i) => ({
        id: i.id,
        sourceId: i.id,
        source: "checklist",
        title: i.title,
        deadline: i.deadline!,
        status: getDeadlineStatus(i.deadline),
      }));

    const fromChecklists: UpcomingDeadline[] = checklistsList
      .filter((cl) => cl.deadline)
      .map((cl) => ({
        id: cl.id,
        sourceId: cl.id,
        source: "checklist",
        title: `[Tugas] ${cl.title}`,
        deadline: cl.deadline!,
        status: getDeadlineStatus(cl.deadline),
      }));

    return [...fromKanban, ...fromChecklistItems, ...fromChecklists].sort(
      (a, b) => a.deadline.getTime() - b.deadline.getTime()
    );
  },

  async getOverdueCount(): Promise<number> {
    const upcoming = await deadlineService.getUpcomingDeadlines();
    return upcoming.filter((d) => d.status === "overdue" || d.status === "today").length;
  },
};