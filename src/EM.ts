import { ZodError, ZodUnion, type ZodTypeAny } from "zod";
import type { Repository } from "./interfaces/Repository.interface.js";
import type { BaseEventType, BaseInputEventType } from "./events/base.event.js";
import type { Logger } from "./interfaces/Logger.interface.js";
import { VoidLogger } from "./loggers/Void.logger.js";
import type { EventUpgrader } from "./interfaces/Upgrader.interface.js";
import { EventBus } from "./EventBus.js";
import type { ReplayQuery } from "./interfaces/ReplayQuery.js";
import { InMemoryRepository } from "./repos/InMemory.repository.js";

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
  private logger: Logger<Event>;

  constructor({
    events,
    repository = new InMemoryRepository<Event>(),
    upgraders = [],
    eventBus = new EventBus<Event>(),
    logger = new VoidLogger(),
  }: {
    events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>;
    repository?: Repository<Event>;
    upgraders?: Array<EventUpgrader<Event>>;
    eventBus?: EventBus<Event>;
    logger?: Logger<Event>;
  }) {
    this.events = events;
    this.repo = repository;
    this.upgraders = upgraders;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  private applyUpgrades(event: Event): Event {
    return this.upgraders.reduce(
      (upgradedEvent, upgrader) => upgrader.upgrade(upgradedEvent),
      event
    );
  }

  /**
   * Emit an event after parsing and applying upgrades.
   * @param event - The event to emit.
   * @throws Will throw an error if the event emission fails.
   */
  public async emit(event: InputEvent): Promise<void> {
    try {
      const parsedEvent = this.events.parse(event) as Event;
      const upgradedEvent = this.applyUpgrades(parsedEvent);
      await this.repo.emitEvent(upgradedEvent);
      await Promise.all([
        this.eventBus.publish(parsedEvent),
        this.logger.logEvent(upgradedEvent),
      ]);
    } catch (error) {
      // Handle errors appropriately
      // console.error("Failed to emit event:", error);
      // throw error; // Re-throw to ensure calling code can handle it
      if (error instanceof ZodError) {
        console.error("Failed to emit event:", error.message); // Log only the error message
      }
      throw new Error("Event emission failed");
    }
  }

  /**
   * Replay events from the repository matching the query.
   * @param query - The query to filter events.
   * @returns An async iterable of upgraded events.
   */
  public async *replay(query: ReplayQuery<Event>): AsyncIterable<Event> {
    for await (const event of this.repo.replay(query)) {
      const upgradedEvent = this.applyUpgrades(event);
      yield upgradedEvent;
      await this.logger.logProjectionItem(query, upgradedEvent);
    }
  }
}
