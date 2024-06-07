import { z } from "zod";

export const baseEvent = z.object({
  id: z
    .string()
    .uuid()
    .default(() => crypto.randomUUID()),
  entityId: z.string().uuid().optional(),
  seq: z.number().int().positive().optional(),
  type: z.string(),
  version: z.number().int().positive().default(1),
  createdAt: z.date().default(() => new Date()),
  payload: z.record(z.unknown()),
});

export type BaseEventType = z.infer<typeof baseEvent>;
export type BaseInputEventType = z.input<typeof baseEvent>;
