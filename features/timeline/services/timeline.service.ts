import { timelineRepository } from "@/features/timeline/repositories/timeline.repository";
import { NotFoundError } from "@/lib/errors";
import type { TimelineEvent } from "@/lib/db/schema";

export const timelineService = {
  async getAll(): Promise<TimelineEvent[]> {
    return timelineRepository.findInRange(new Date(0), new Date("2100-01-01"));
  },
  async create(input: {
    title: string;
    description?: string | null;
    startAt: Date;
    endAt?: Date | null;
    color?: string;
  }): Promise<TimelineEvent> {
    return timelineRepository.create({
      title: input.title,
      description: input.description ?? null,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      color: input.color ?? "#3B82F6",
    });
  },
  async delete(id: string): Promise<void> {
    await timelineRepository.delete(id);
  },
};
