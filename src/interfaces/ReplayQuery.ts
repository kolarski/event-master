import type { BaseEventType } from "../events/base.event.js";

export interface ReplayQuery<Event extends BaseEventType> {
  seq?: { from?: number; to?: number };
  streamId?: Event["streamId"];
  eventTypes?: Array<Event["type"]>;
  payload?: Record<string, unknown>;
  createdAt?: { from?: Date; to?: Date };
}
