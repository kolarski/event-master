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
  private currentSeq = 0;
  private seqMutex = new Mutex();

  async validateEventsTable(): Promise<void> {
    this.events = [];
  }

  async validateStreamsTable(): Promise<void> {
    this.streams = [];
  }
  private doesEventMatchQuery(
    query: ReplayQuery<Readonly<Event>>
  ): (event: Readonly<Event>) => boolean {
    return (event: Readonly<Event>): boolean =>
      this.matchStreamId(event, query) &&
      this.matchSeqFrom(event, query) &&
      this.matchSeqTo(event, query) &&
      this.matchEventTypes(event, query) &&
      this.matchPayload(event, query) &&
      this.matchCreatedAtFrom(event, query) &&
      this.matchCreatedAtTo(event, query);
  }
  private matchStreamId = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean => !query.entityId || event.entityId === query.entityId;

  private matchSeqFrom = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean => !query.seq?.from || event.seq >= query.seq.from;

  private matchSeqTo = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean => !query.seq?.to || event.seq <= query.seq.to;

  private matchEventTypes = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean => !query.eventTypes || query.eventTypes.includes(event.type);

  private matchPayload = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean => {
    if (!query.payload) {
      return true;
    }
    for (const key in query.payload) {
      if (query.payload[key] !== event.payload[key]) {
        return false;
      }
    }
    return true;
  };

  private matchCreatedAtFrom = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean =>
    !query.createdAt?.from || event.createdAt >= query.createdAt.from;

  private matchCreatedAtTo = (
    event: Readonly<Event>,
    query: ReplayQuery<Readonly<Event>>
  ): boolean => !query.createdAt?.to || event.createdAt <= query.createdAt.to;

  async *replay(
    query: ReplayQuery<Readonly<Event>>
  ): AsyncIterable<Readonly<Event>> {
    const filteredEvents = this.events.filter(this.doesEventMatchQuery(query)),
      sortedEvents = filteredEvents.sort(
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
      this.currentSeq += 1;
      event.seq = this.currentSeq;
      this.events.push(event);
      this.updateEntityStream(event);
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

  private updateEntityStream(event: Event): void {
    if (event.entityId) {
      const index = this.streams.findIndex((s) => s.id === event.entityId);
      if (index === -1) {
        this.streams.push({
          id: event.entityId,
          type: event.type,
          seq: 0,
        });
      } else {
        const stream = this.streams[index];
        if (!stream) {
          throw new Error("Stream not found");
        }
        if (
          typeof event.expectedLastEntityId !== "undefined" &&
          stream.seq !== event.expectedLastEntityId
        ) {
          throw new Error(
            `Cannot emit event with expectedLastEntityId = ${event.expectedLastEntityId}. Stream has seq = ${stream.seq}`
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
