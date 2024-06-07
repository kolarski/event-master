import { z } from "zod";
import { baseEvent } from "./../../events/base.event";

export default baseEvent.extend({
  type: z.literal("scraper-started"),
  payload: z.object({
    name: z.string().min(1),
  }),
});
