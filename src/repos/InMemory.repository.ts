import type { BaseEventType } from "../events/base.event";
import type { ProjectionQuery } from "../interfaces/ProjectionQuery";
import type { Repository } from "../interfaces/Repository.interface";

export class InMemoryRepository<Event extends BaseEventType>
  implements Repository<Event>
{
  private events: Array<Event> = [];
  private lastProcessedEventIds: Record<string, string | null> = {};
  private currentSeq: number = 0; // Added currentSeq property

  async *projection(query: ProjectionQuery<Event>): AsyncIterable<Event> {
    const filteredEvents = this.events.filter((event) => {
      if (query.entityId && event.entityId !== query.entityId) {
        return false;
      }
      if (query.eventTypes && !query.eventTypes.includes(event.type)) {
        return false;
      }
      if (query.payload) {
        for (const key in query.payload) {
          if (query.payload[key] !== event.payload[key]) {
            return false;
          }
        }
      }
      if (query.createdAt) {
        if (query.createdAt.from && event.createdAt < query.createdAt.from) {
          return false;
        }
        if (query.createdAt.to && event.createdAt > query.createdAt.to) {
          return false;
        }
      }
      return true;
    });

    const sortedEvents = filteredEvents.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (const event of sortedEvents) {
      yield event;
    }
  }

  public async emitEvent(event: Event): Promise<void> {
    event.seq = ++this.currentSeq; // Increment and assign seq
    this.events.push(event);
  }

  public async getAllEvents(): Promise<Event[]> {
    return this.events;
  }

  public async saveLastProcessedEventId(
    projectionName: string,
    eventId: string
  ): Promise<void> {
    this.lastProcessedEventIds[projectionName] = eventId;
  }

  public async getLastProcessedEventId(
    projectionName: string
  ): Promise<string | null> {
    return this.lastProcessedEventIds[projectionName] || null;
  }
}
