"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { timelineService } from "@/features/timeline/services/timeline.service";
import type { ActionResult } from "@/types/api";
import type { TimelineEvent } from "@/lib/db/schema";

export async function createTimelineEventAction(input: {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  color?: string;
}): Promise<ActionResult<TimelineEvent>> {
  await requireAuth();
  if (!input.title?.trim()) return { success: false, error: "Judul wajib diisi." };
  const event = await timelineService.create({
    title: input.title.trim(),
    description: input.description || null,
    startAt: new Date(input.startAt),
    endAt: input.endAt ? new Date(input.endAt) : null,
    color: input.color,
  });
  revalidatePath("/calendar");
  return { success: true, data: event };
}

export async function deleteTimelineEventAction(id: string): Promise<void> {
  await requireAuth();
  await timelineService.delete(id);
  revalidatePath("/calendar");
}
