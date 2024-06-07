import type { BaseEventType } from "../events/base.event";
import type { ReplayQuery } from "../interfaces/ReplayQuery";
import type { Repository } from "../interfaces/Repository.interface";
export class InMemoryRepository<Event extends BaseEventType>
  implements Repository<Event>
{
  private events: Array<Readonly<Event>> = [];
  private lastProcessedEventIds: Record<string, string | null> = {};
  private currentSeq: number = 0;

  async *replay(
    query: ReplayQuery<Readonly<Event>>
  ): AsyncIterable<Readonly<Event>> {
    const filteredEvents = this.events.filter((event) => {
      if (query.aggregateId && event.aggregateId !== query.aggregateId)
        return false;
      if (query.seq?.from && event.seq < query.seq.from) return false;
      if (query.seq?.to && event.seq > query.seq.to) return false;
      if (query.eventTypes && !query.eventTypes.includes(event.type))
        return false;
      if (query.payload) {
        for (const key in query.payload) {
          if (query.payload[key] !== event.payload[key]) return false;
        }
      }
      if (query.createdAt?.from && event.createdAt < query.createdAt.from)
        return false;
      if (query.createdAt?.to && event.createdAt > query.createdAt.to)
        return false;
      return true;
    });

    const sortedEvents = filteredEvents.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const event of sortedEvents) {
      yield event;
    }
  }

  public async emitEvent(event: Event): Promise<void> {
    event.seq = ++this.currentSeq;
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
