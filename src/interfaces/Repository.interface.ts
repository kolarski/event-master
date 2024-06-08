import type { BaseEventType } from "../events/base.event.js";
import type { ReplayQuery } from "./ReplayQuery.js";

export interface Repository<Event extends BaseEventType> {
  validateEventsTable(): Promise<void>;
  validateStreamsTable(): Promise<void>;
  emitEvent(event: Event): Promise<void>;
  emitEvents(events: Array<Event>): Promise<void>; // Transactional
  replay(query: ReplayQuery<Event>): AsyncIterable<Event>;
  getAllEvents(): Promise<Array<Event>>;
  getLastProcessedEventId(projectionName: string): Promise<string | null>;
}
