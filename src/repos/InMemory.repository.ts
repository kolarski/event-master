import type { BaseEventType } from "../events/base.event";
import type { ReplayQuery } from "../interfaces/ReplayQuery";
import type { Repository } from "../interfaces/Repository.interface";
import type { Stream } from "../interfaces/Stream.interface";
import { Mutex } from "../utils/Mutex";

/**
 * An in-memory implementation of the Repository interface.
 */
export class InMemoryRepository<Event extends BaseEventType>
  implements Repository<Event>
{
  private events: Array<Readonly<Event>> = [];
  private streams: Array<Stream> = [];
  private lastProcessedEventIds: Record<string, string | null> = {};
  private currentSeq: number = 0;
  private seqMutex = new Mutex();

  async validateEventsTable(): Promise<void> {
    this.events = [];
    return;
  }

  async validateStreamsTable(): Promise<void> {
    this.streams = [];
    return;
  }

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
    const unlock = await this.seqMutex.lock();
    try {
      event.seq = ++this.currentSeq;
      this.events.push(event);
      this.updateStream(event);
    } finally {
      unlock();
    }
  }

  public async getAllStreams(): Promise<Stream[]> {
    return this.streams;
  }

  private updateStream(event: Event): void {
    if (event.aggregateId) {
      const index = this.streams.findIndex((s) => s.id === event.aggregateId);
      if (index === -1) {
        this.streams.push({
          id: event.aggregateId,
          type: event.type,
          seq: 0,
        });
      } else {
        const stream = this.streams[index];
        if (
          typeof event.expected_stream_seq !== "undefined" &&
          stream.seq !== event.expected_stream_seq
        ) {
          throw new Error(
            `Cannot emit event with expected_stream_seq = ${event.expected_stream_seq}. Stream has seq = ${stream.seq}`
          );
        }
        stream.seq += 1;
      }
    }
  }

  // It should be transactional
  public async emitEvents(events: Array<Event>): Promise<void> {
    for (const event of events) {
      this.emitEvent(event);
    }
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
