import type { BaseEventType } from "./events/base.event.js";
import type { EventHandler } from "./interfaces/EventHandler.type.js";
import type { Logger } from "./interfaces/Logger.interface.js";
import type { SubscriptionQuery } from "./interfaces/SubscriptionQuery.js";
import { VoidLogger } from "./loggers/Void.logger.js";

export class EventBus<Event extends BaseEventType> {
  private handlers: Array<EventHandler<Event>> = [];
  private logger: Logger<Event>;

  constructor(logger: Logger<Event> = new VoidLogger()) {
    this.logger = logger;
  }

  /**
   * Subscribe a new event handler.
   * @param handler - The handler to subscribe.
   */
  subscribe(
    _query: SubscriptionQuery<Event>,
    handler: EventHandler<Event>
  ): void {
    this.handlers.push(handler);
  }

  /**
   * Publish an event to all subscribed handlers.
   * @param event - The event to publish.
   */
  async publish(event: Event): Promise<void> {
    for (const handler of this.handlers) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await handler(event);
      } catch (error) {
        // Handle individual handler errors without disrupting others
        this.logger.error(`Error in handler: ${error}`);
      }
    }
  }
}
