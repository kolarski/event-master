import type { BaseEventType } from "../events/base.event.js";
import type { Logger } from "../interfaces/Logger.interface.js";
import type { ProjectionQuery } from "../interfaces/ProjectionQuery.js";

export class VoidLogger<Event extends BaseEventType> implements Logger<Event> {
  public async error(_error: string): Promise<void> {
    // Do nothing
  }
  public async logEvent(_event: Event): Promise<void> {
    // Do nothing
  }

  public async logProjectionItem(
    _query: ProjectionQuery<Event>,
    _projection: Event
  ): Promise<void> {
    // Do nothing
  }
}
