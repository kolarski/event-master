import type { BaseEventType } from "../events/base.event.js";
import type { ReplayQuery } from "./ReplayQuery.js";
import type { Stream } from "./Stream.interface.js";

export interface Repository<Event extends BaseEventType> {
  validateEventsTable(): Promise<void>;
  validateStreamsTable(): Promise<void>;
  emitEvent(event: Event): Promise<void>;
  // Should be Transactional
  emitEvents(events: Array<Event>): Promise<void>;
  replay(query: ReplayQuery<Event>): AsyncIterable<Event>;
  getAllEvents(): AsyncIterable<Event>;
  getAllStreams(): AsyncIterable<Stream>;
}
