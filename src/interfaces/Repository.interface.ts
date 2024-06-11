import type { BaseEventType } from "../events/base.event.js";
import type { ReplayQuery } from "./ReplayQuery.js";
import type { EntityStream } from "./EntityStream.interface.js";

export interface Repository<Event extends BaseEventType> {
  validateEventsTable(): Promise<void>;
  validateStreamsTable(): Promise<void>;
  emitEvent(event: Event): Promise<void>;
  // Should be Transactional
  emitEvents(events: Array<Event>): Promise<void>;
  replay(query: ReplayQuery<Event>): AsyncIterable<Event>;
  getAllEvents(): AsyncIterable<Event>;
  getAllEntityStreams(): AsyncIterable<EntityStream<Event>>;
}
