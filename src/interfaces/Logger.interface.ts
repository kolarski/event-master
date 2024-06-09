import type { BaseEventType } from "../events/base.event.js";
import type { ProjectionQuery } from "./ProjectionQuery.js";

export interface Logger<T extends BaseEventType> {
  logEvent(event: T): Promise<void>;
  error(error: string): Promise<void>;
  logProjectionItem(query: ProjectionQuery<T>, event: T): Promise<void>;
}
