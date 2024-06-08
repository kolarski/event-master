import type { BaseEventType } from "../events/base.event.js";

export interface ReplayQuery<Event extends BaseEventType> {
  seq?: { from?: number; to?: number };
  streamId?: Event["streamId"];
  eventTypes?: Event["type"][];
  payload?: Record<string, any>;
  createdAt?: { from?: Date; to?: Date };
}
