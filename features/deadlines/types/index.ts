import type { DeadlineStatus } from "@/types/common";

export type UpcomingDeadline = {
  id: string;
  sourceId: string;
  source: "kanban" | "checklist";
  title: string;
  deadline: Date;
  status: DeadlineStatus;
};