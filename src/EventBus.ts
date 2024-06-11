import type { BaseEventType } from "./events/base.event.js";
import type { EventHandler } from "./interfaces/EventHandler.type.js";
import type { Logger } from "./interfaces/Logger.interface.js";
import type { Repository } from "./interfaces/Repository.interface.js";
import type { SubscriptionQuery } from "./interfaces/SubscriptionQuery.js";
import { VoidLogger } from "./loggers/Void.logger.js";

export class EventBus<Event extends BaseEventType> {
  private handlers: Array<{
    query: SubscriptionQuery<Event>;
    handler: EventHandler<Event>;
  }> = [];
  private logger: Logger<Event>;
  private repo: Repository<Event>;

  constructor(
    repo: Repository<Event>,
    logger: Logger<Event> = new VoidLogger()
  ) {
    this.logger = logger;
    this.repo = repo;
  }

  /**
   * Subscribe a new event handler.
   * @param handler - The handler to subscribe.
   */
  public subscribe(
    query: SubscriptionQuery<Event>,
    handler: EventHandler<Event>
  ): void {
    this.handlers.push({
      query,
      handler,
    });
  }

  public async catchUpAndSubscribe(
    query: SubscriptionQuery<Event>,
    handler: EventHandler<Event>
  ) {
    const events = this.repo.replay(query);
    for await (const event of events) {
      await handler(event);
    }
    this.subscribe(query, handler);
  }

  /**
   * Publish an event to all subscribed handlers.
   * @param event - The event to publish.
   */
  async publish(event: Event): Promise<void> {
    for (const item of this.handlers) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await item.handler(event);
        // If (item.query.entityId && item.query.entityId !== event.entityId) {
        //
        //   Await item.handler(event);
        // }
      } catch (error) {
        // Handle individual handler errors without disrupting others
        this.logger.error(`Error in handler: ${error}`);
      }
    }
  }
}
