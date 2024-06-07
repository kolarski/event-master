import type { BaseEventType } from "../events/base.event";
import type { Logger } from "../interfaces/Logger.interface";
import type { ProjectionQuery } from "../interfaces/ProjectionQuery";

export class VoidLogger<Event extends BaseEventType> implements Logger<Event> {
  public async logEvent(event: Event): Promise<void> {}

  public async logProjectionItem(
    query: ProjectionQuery<Event>,
    projection: Event
  ): Promise<void> {}
}
