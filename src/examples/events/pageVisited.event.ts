import { z } from "zod";
import { baseEvent } from "./../../events/base.event";

export default baseEvent
  .extend({
    type: z.literal("page-visited"),
    version: z.literal(1).default(1),
    entityId: z.string(),
    payload: z.object({
      url: z.string().url(),
      visitedDate: z.string().datetime(),
      html: z.string().min(1),
      htmlStatus: z.number().int().min(100).max(599),
    }),
  })
  .readonly();
