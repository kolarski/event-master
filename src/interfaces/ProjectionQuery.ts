import type { BaseEventType } from "../events/base.event.js";

export type ProjectionQuery<Event extends BaseEventType> = {
  aggregateId?: Event["aggregateId"];
  eventTypes?: Event["type"][];
  payload?: Record<string, any>;
  createdAt?: { from?: Date; to?: Date };
};
