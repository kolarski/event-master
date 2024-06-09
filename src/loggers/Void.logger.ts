import type { BaseEventType } from "../events/base.event.js";
import type { Logger } from "../interfaces/Logger.interface.js";
import type { ProjectionQuery } from "../interfaces/ProjectionQuery.js";

export class VoidLogger<Event extends BaseEventType> implements Logger<Event> {
  public async error(_error: string): Promise<void> {}
  public async logEvent(event: Event): Promise<void> {}

  public async logProjectionItem(
    query: ProjectionQuery<Event>,
    projection: Event
  ): Promise<void> {}
}
