import pageVisitedEvent from "./../events/pageVisited.event";
import scraperStartedEvent from "./../events/scraperStarted.event";
import scraperFinishedEvent from "./../events/scraperFinished.event";
import { z, type ZodTypeAny } from "zod";

const eventSchema = z.union([
  pageVisitedEvent,
  scraperStartedEvent,
  scraperFinishedEvent,
]);

type EventType = z.infer<typeof eventSchema>;
type EventInputType = z.input<typeof eventSchema>;

export { eventSchema };
export type { EventType, EventInputType };
