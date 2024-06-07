import type { BaseEventType } from "../events/base.event.js";

export type ProjectionQuery<Event extends BaseEventType> = {
  entityId?: Event["entityId"];
  eventTypes?: Event["type"][];
  payload?: Record<string, any>;
  createdAt?: { from?: Date; to?: Date };
};
