/* eslint-disable no-console */
import type { BaseEventType } from "../events/base.event";
import type { Logger } from "../interfaces/Logger.interface";

export class ConsoleLogger<Event extends BaseEventType>
  implements Logger<Event>
{
  public async error(error: string): Promise<void> {
    console.error(error);
  }
  public async logEvent(event: Event): Promise<void> {
    console.log(
      `Event emitted: ${event.type} for ${event.entityId}: ${JSON.stringify(
        event.payload,
        null,
        4
      )}`
    );
  }
}
