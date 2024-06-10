import type { BaseEventType } from "../events/base.event.js";

export interface SubscriptionQuery<Event extends BaseEventType> {
  seq?: { from?: number; to?: number };
  streamId?: Event["streamId"];
  eventTypes?: Event["type"][];
  payload?: Record<string, unknown>;
  createdAt?: { from?: Date; to?: Date };
}