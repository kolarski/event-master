import type { BaseEventType } from "../events/base.event";

export interface EntityStream<Event extends BaseEventType> {
  id: string;
  entityId: Event["id"];
  eventTypes: Array<Event["type"]>;
  lastEventSeq: Event["seq"];
}
