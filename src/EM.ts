import { ZodUnion, z, type ZodTypeAny } from "zod";
import type { Repository } from "./interfaces/Repository.interface";
import type { BaseEventType, BaseInputEventType } from "./events/base.event";
import type { Logger } from "./interfaces/Logger.interface";
import { VoidLogger } from "./loggers/Void.logger";
import type { EventUpgrader } from "./interfaces/Upgrader.interface";
import type { EventBus } from "./EventBus";
import type { ReplayQuery } from "./interfaces/ReplayQuery";

/**
 * The EM class represents the Event Master.
 */
export class EM<
  Event extends BaseEventType,
  InputEvent extends BaseInputEventType
> {
  private events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>;
  private repo: Repository<Event>;
  private upgraders: EventUpgrader<Event>[];
  private eventBus: EventBus<Event>;
  private logger: Logger<Event> = new VoidLogger();

  constructor(
    events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>,
    repo: Repository<Event>,
    upgraders: EventUpgrader<Event>[],
    eventBus: EventBus<Event>,
    logger?: Logger<Event>
  ) {
    this.events = events;
    this.repo = repo;
    this.upgraders = upgraders;
    this.eventBus = eventBus;
    this.logger;
    if (logger) {
      this.logger = logger;
    }
  }

  private applyUpgrades(event: Event): Event {
    return this.upgraders.reduce(
      (upgradedEvent, upgrader) => upgrader.upgrade(upgradedEvent),
      event
    );
  }

  public async emit(event: InputEvent) {
    const parsedEvent = this.events.parse(event) as Event;
    const upgradedEvent = this.applyUpgrades(parsedEvent);
    await this.repo.emitEvent(upgradedEvent);
    await this.eventBus.publish(parsedEvent);
    await this.logger.logEvent(upgradedEvent);
  }

  public async *replay(query: ReplayQuery<Event>): AsyncIterable<Event> {
    for await (const event of this.repo.replay(query)) {
      const upgradedEvent = this.applyUpgrades(event);
      yield upgradedEvent;
      await this.logger.logProjectionItem(query, upgradedEvent);
    }
  }

  // public async *replay(query: ReplayQuery<Event>): AsyncIterable<Event> {
  //   if (query.seq?.from && query.seq?.to && query.seq?.from >= query.seq?.to) {
  //     throw new Error("startSeq must be less than endSeq");
  //   }

  //   const events = this.repo.projection(query);
  //   const filteredEvents = [];

  //   for await (const event of events) {
  //     if (event.seq >= query.seq.from && event.seq <= query.seq?.to) {
  //       filteredEvents.push(event);
  //     }
  //   }

  //   filteredEvents.sort((a, b) => a.seq - b.seq);

  //   for (const event of filteredEvents) {
  //     yield event;
  //     await this.logger.logProjectionItem(query, event);
  //   }
  // }
}
