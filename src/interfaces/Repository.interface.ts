import type { BaseEventType } from "../events/base.event";
import type { ProjectionQuery } from "./ProjectionQuery";

export interface Repository<Event extends BaseEventType> {
  emitEvent(event: Event): Promise<void>;
  projection(query: ProjectionQuery<Event>): AsyncIterable<Event>;
  getAllEvents(): Promise<Array<Event>>;
  getLastProcessedEventId(projectionName: string): Promise<string | null>;
}
