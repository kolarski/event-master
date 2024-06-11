import { z } from "zod";

export const baseEvent = z.object({
  id: z.string().uuid(),
  // .default(() => crypto.randomUUID()),
  entityId: z.string().uuid().optional(),
  seq: z
    .number()
    .safe()
    .finite()
    .int()
    .nonnegative()
    .optional()
    .default(0)
    .describe("Unique auto-incrementing sequence number for each event"),
  expectedLastEntitySeq: z
    .number()
    .safe()
    .finite()
    .int()
    .nonnegative()
    .optional()
    .describe("Expected sequence number of the stream"),
  type: z.string(),
  version: z.number().safe().finite().int().positive().default(1),
  createdAt: z.date().default(() => new Date()),
  payload: z.record(z.string(), z.unknown()),
  metadata: z
    .object({
      causationId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
    })
    .catchall(z.unknown())
    .default({}),
});

export type BaseEventType = z.infer<typeof baseEvent>;
export type BaseInputEventType = z.input<typeof baseEvent>;
