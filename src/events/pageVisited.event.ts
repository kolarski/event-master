import { z } from "zod";
import { baseEvent } from "./base.event";

export default baseEvent.extend({
  type: z.literal("page-visited"),
  entityId: z.string(),
  payload: z.object({
    url: z.string().url(),
    visited_date: z.string().datetime(),
    html: z.string(),
    html_status: z.number().int().min(100).max(599),
  }),
});
