import { z } from "zod";
import { baseEvent } from "./../../src/events/base.event";

const PageVisitedEvent = baseEvent.extend({
  type: z.literal("page-visited"),
  version: z.literal(1).default(1),
  entityId: z.string(),
  payload: z.object({
    url: z.string().url(),
    visited_date: z.string().datetime(),
    html: z.string().min(1),
    html_status: z.number().int().min(100).max(599),
  }),
});

const PageVisitedV2Event = baseEvent.extend({
  type: z.literal("page-visited"),
  version: z.literal(2),
  entityId: z.string(),
  payload: z.object({
    url: z.string().url(),
    visited_date: z.string().datetime(),
    html: z.string(),
    html_status: z.number().int().min(100).max(599),
    userAgent: z.string(),
  }),
});

const BrokenLinkEvent = baseEvent.extend({
  type: z.literal("broken-link"),
  version: z.literal(1).default(1),
  entityId: z.string(),
  payload: z.object({
    url: z.string().url(),
    visited_date: z.string().datetime(),
    html_status: z.number().int().min(100).max(599),
  }),
});

const eventSchema = z.union([
  PageVisitedEvent,
  PageVisitedV2Event,
  BrokenLinkEvent,
]);

type EventInputType = z.input<typeof eventSchema>;
type EventType = z.output<typeof eventSchema>;

export {
  eventSchema,
  EventInputType,
  EventType,
  PageVisitedEvent,
  PageVisitedV2Event,
  BrokenLinkEvent,
};
