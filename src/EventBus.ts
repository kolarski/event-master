import type { BaseEventType } from "./events/base.event.js";
import type { EventHandler } from "./interfaces/EventHandler.type.js";

export class EventBus<Event extends BaseEventType> {
  private handlers: EventHandler<Event>[] = [];

  /**
   * Subscribe a new event handler.
   * @param handler - The handler to subscribe.
   */
  subscribe(handler: EventHandler<Event>): void {
    this.handlers.push(handler);
  }

  /**
   * Publish an event to all subscribed handlers.
   * @param event - The event to publish.
   */
  async publish(event: Event): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (error) {
        // Handle individual handler errors without disrupting others
        console.error(`Error in handler: ${error}`);
      }
    }
  }
}
