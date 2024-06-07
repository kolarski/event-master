import type { BaseEventType } from "./events/base.event.js";
import type { EventHandler } from "./interfaces/EventHandler.type.js";

export class EventBus<Event extends BaseEventType> {
  private handlers: EventHandler<Event>[] = [];

  subscribe(handler: EventHandler<Event>): void {
    this.handlers.push(handler);
  }

  async publish(event: Event): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }
}
