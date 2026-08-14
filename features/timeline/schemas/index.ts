import { z } from "zod";

export const createTimelineEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
});

export type CreateTimelineEventInput = z.infer<typeof createTimelineEventSchema>;