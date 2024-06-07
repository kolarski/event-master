import type { BaseEventType } from "../events/base.event.js";
import type { ReplayQuery } from "./ReplayQuery.js";

export interface Repository<Event extends BaseEventType> {
  emitEvent(event: Event): Promise<void>;
  replay(query: ReplayQuery<Event>): AsyncIterable<Event>;
  // projection(query: ProjectionQuery<Event>): AsyncIterable<Event>;
  getAllEvents(): Promise<Array<Event>>;
  getLastProcessedEventId(projectionName: string): Promise<string | null>;
}
