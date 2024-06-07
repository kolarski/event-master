import { z } from "zod";

import pageVisitedEvent from "./../events/pageVisited.event";
import scraperStartedEvent from "./../events/scraperStarted.event";
import scraperFinishedEvent from "./../events/scraperFinished.event";
import pageVisitedV2Event from "./pageVisited.v2.event";

const eventSchema = z.union([
  pageVisitedEvent,
  pageVisitedV2Event,
  scraperStartedEvent,
  scraperFinishedEvent,
]);

type EventInputType = z.input<typeof eventSchema>;
type EventType = z.output<typeof eventSchema>;

export { eventSchema };
export type { EventType, EventInputType };
