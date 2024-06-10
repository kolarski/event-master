import { ZodError, type ZodTypeAny, ZodUnion } from "zod";
import type { Repository } from "./interfaces/Repository.interface.js";
import type { BaseEventType, BaseInputEventType } from "./events/base.event.js";
import type { Logger } from "./interfaces/Logger.interface.js";
import { VoidLogger } from "./loggers/Void.logger.js";
import type { EventUpgrader } from "./interfaces/Upgrader.interface.js";
import { EventBus } from "./EventBus.js";
import type { ReplayQuery } from "./interfaces/ReplayQuery.js";
import { InMemoryRepository } from "./repos/InMemory.repository.js";
import type { Stream } from "./interfaces/Stream.interface.js";
import type { EventHandler } from "./interfaces/EventHandler.type.js";
import type { SubscriptionQuery } from "./interfaces/SubscriptionQuery.js";

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
  private isInitialized: boolean = false;

  public static async create<
    EventCreate extends BaseEventType,
    InputEventCreate extends BaseInputEventType
  >({
    events,
    repository = new InMemoryRepository<EventCreate>(),
    upgraders = [],
    logger = new VoidLogger(),
  }: {
    events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>;
    repository?: Repository<EventCreate>;
    upgraders?: Array<EventUpgrader<EventCreate>>;
    logger?: Logger<EventCreate>;
  }): Promise<EM<EventCreate, InputEventCreate>> {
    const em = new EM<EventCreate, InputEventCreate>({
      events,
      repository,
      upgraders,
      logger,
    });
    await em.init();
    return em;
  }

  private constructor({
    events,
    repository = new InMemoryRepository<Event>(),
    upgraders = [],
    logger = new VoidLogger(),
  }: {
    events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>;
    repository?: Repository<Event>;
    upgraders?: Array<EventUpgrader<Event>>;
    logger?: Logger<Event>;
  }) {
    this.events = events;
    this.repo = repository;
    this.upgraders = upgraders;
    this.logger = logger;
    this.eventBus = new EventBus<Event>(this.logger);
  }

  public async init(): Promise<void> {
    this.repo.validateEventsTable();
    this.repo.validateStreamsTable();
    this.isInitialized = true;
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
    if (!this.isInitialized) {
      throw new Error("EM is not initialized. Please call EM.init() first.");
    }
    try {
      const parsedEvent = this.events.parse(event) as Event,
        upgradedEvent = this.applyUpgrades(parsedEvent);
      await this.repo.emitEvent(upgradedEvent);
      await Promise.all([
        this.eventBus.publish(parsedEvent),
        this.logger.logEvent(upgradedEvent),
      ]);
    } catch (error) {
      this.logger.error(
        `Failed to emit event: ${
          error instanceof ZodError ? error.message : error
        }`
      );

      throw new Error(`Event emission failed: ${error}`);
    }
  }

  /**
   * Replay events from the repository matching the query.
   * @param query - The query to filter events.
   * @returns An async iterable of upgraded events.
   */
  public async *replay(
    query: ReplayQuery<Event>
  ): AsyncIterable<Readonly<Event>> {
    if (!this.isInitialized) {
      throw new Error("EM is not initialized. Please call EM.init() first.");
    }
    for await (const event of this.repo.replay(query)) {
      const upgradedEvent = this.applyUpgrades(event);
      yield upgradedEvent;
      await this.logger.logProjectionItem(query, upgradedEvent);
    }
  }

  public getAllStreams(): AsyncIterable<Stream> {
    return this.repo.getAllStreams();
  }

  public getAllEvents(): AsyncIterable<Readonly<Event>> {
    return this.repo.getAllEvents();
  }

  public subscribe(
    query: SubscriptionQuery<Event>,
    handler: EventHandler<Event>
  ): void {
    this.eventBus.subscribe(query, handler);
  }
}
