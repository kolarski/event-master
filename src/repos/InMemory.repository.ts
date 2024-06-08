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
      if (query.streamId && event.streamId !== query.streamId) return false;
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

  public async *getAllEvents(): AsyncIterable<Event> {
    for (const event of this.events) {
      yield event;
    }
  }

  public async *getAllStreams(): AsyncIterable<Stream> {
    for (const stream of this.streams) {
      yield stream;
    }
  }

  private updateStream(event: Event): void {
    if (event.streamId) {
      const index = this.streams.findIndex((s) => s.id === event.streamId);
      if (index === -1) {
        this.streams.push({
          id: event.streamId,
          type: event.type,
          seq: 0,
        });
      } else {
        const stream = this.streams[index];
        if (
          typeof event.expectedStreamSeq !== "undefined" &&
          stream.seq !== event.expectedStreamSeq
        ) {
          throw new Error(
            `Cannot emit event with expectedStreamSeq = ${event.expectedStreamSeq}. Stream has seq = ${stream.seq}`
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
}
