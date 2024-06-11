import type { BaseEventType } from "../events/base.event.js";

export interface Logger<T extends BaseEventType> {
  logEvent(event: T): Promise<void>;
  error(error: string): Promise<void>;
}
