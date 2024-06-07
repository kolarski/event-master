import type { BaseEventType } from "../events/base.event";
import type { ProjectionQuery } from "./ProjectionQuery";

export interface Logger<T extends BaseEventType> {
  logEvent(event: T): Promise<void>;
  logProjectionItem(query: ProjectionQuery<T>, event: T): Promise<void>;
}
