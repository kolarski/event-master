/* eslint-disable no-console */
import type { BaseEventType } from "../events/base.event";
import type { Logger } from "../interfaces/Logger.interface";
import type { ProjectionQuery } from "../interfaces/ProjectionQuery";

export class ConsoleLogger<Event extends BaseEventType>
  implements Logger<Event>
{
  public async error(error: string): Promise<void> {
    console.error(error);
  }
  public async logEvent(event: Event): Promise<void> {
    console.log(
      `Event emitted: ${event.type} for ${event.streamId}: ${JSON.stringify(
        event.payload,
        null,
        4
      )}`
    );
  }

  public async logProjectionItem(
    query: ProjectionQuery<Event>,
    event: Event
  ): Promise<void> {
    console.log(
      `Projection query ${JSON.stringify(query, null, 4)}. Event: `,
      event
    );
  }
}
