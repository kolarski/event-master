import type { BaseEventType } from "../events/base.event";
import type { ReplayQuery } from "../interfaces/ReplayQuery";
import type { Repository } from "../interfaces/Repository.interface";
import type { EntityStream } from "../interfaces/EntityStream.interface";
import { Mutex } from "../utils/Mutex";

/**
 * An in-memory implementation of the Repository interface.
 */
export class InMemoryRepository<Event extends BaseEventType>
  implements Repository<Event>
{
  private readonly events: Array<Readonly<Event>> = [];
  private readonly streams: Array<EntityStream<Event>> = [];
  // Current sequence number starts at -1 so that the first event will have a sequence number of 0
  private currentSeq = -1;
  private readonly seqMutex = new Mutex();

  async validateEventsTable(): Promise<void> {
    // Skip this.events = [];
  }

  async validateStreamsTable(): Promise<void> {
    // Skip this.streams = [];
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
    const filteredEvents = this.events.filter(this.doesEventMatchQuery(query));
    let sortedEvents = filteredEvents.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    if (query.backwards === true) {
      sortedEvents.reverse();
    }
    if (query.limit) {
      sortedEvents = sortedEvents.slice(0, query.limit);
    }
    for (const event of sortedEvents) {
      yield event;
    }
  }

  public async emitEvent(event: Event): Promise<void> {
    const unlock = await this.seqMutex.lock();
    try {
      if (this.events.some((e) => e.id === event.id)) {
        throw new Error(`Event with id ${event.id} already exists`);
      }
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

  public async *getAllEntityStreams(): AsyncIterable<EntityStream<Event>> {
    for (const stream of this.streams) {
      yield stream;
    }
  }

  private updateEntityStream(event: Event): void {
    if (event.entityId) {
      const stream = this.streams.find(
        (s) =>
          s.entityId === event.entityId && s.eventTypes.includes(event.type)
      );
      if (!stream) {
        this.streams.push({
          id: event.entityId,
          entityId: event.entityId,
          eventTypes: [event.type],
          lastEventSeq: event.seq,
        });
        return;
      }
      if (
        typeof event.expectedLastEntitySeq !== "undefined" &&
        stream.lastEventSeq !== event.expectedLastEntitySeq
      ) {
        throw new Error(
          `Cannot emit event with expectedLastEntitySeq = ${event.expectedLastEntitySeq}. Stream has lastEventSeq = ${stream.lastEventSeq}`
        );
      }
      stream.lastEventSeq = event.seq;
    }
  }

  // It should be transactional
  public async emitEvents(events: Array<Event>): Promise<void> {
    for (const event of events) {
      this.emitEvent(event);
    }
  }
}
