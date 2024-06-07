import type { BaseEventType } from "../events/base.event";

export type EventHandler<Event extends BaseEventType> = (
  event: Event
) => Promise<void>;
