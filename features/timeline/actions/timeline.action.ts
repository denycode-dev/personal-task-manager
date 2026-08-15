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
  
  const startDate = new Date(input.startAt);
  if (isNaN(startDate.getTime())) {
    return { success: false, error: "Waktu mulai tidak valid." };
  }

  let endDate: Date | null = null;
  if (input.endAt && input.endAt.trim()) {
    endDate = new Date(input.endAt);
    if (isNaN(endDate.getTime())) {
      return { success: false, error: "Waktu selesai tidak valid." };
    }
    if (endDate < startDate) {
      return { success: false, error: "Waktu selesai harus setelah waktu mulai." };
    }
  }

  const event = await timelineService.create({
    title: input.title.trim(),
    description: input.description || null,
    startAt: startDate,
    endAt: endDate,
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
