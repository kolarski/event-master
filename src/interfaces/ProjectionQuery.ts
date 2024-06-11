import type { BaseEventType } from "../events/base.event.js";

export interface ProjectionQuery<Event extends BaseEventType> {
  entityId?: Event["entityId"];
  eventTypes?: Array<Event["type"]>;
  payload?: Record<string, unknown>;
  createdAt?: { from?: Date; to?: Date };
}
