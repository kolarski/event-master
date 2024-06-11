import type { BaseEventType } from "../events/base.event.js";
import type { FilterQuery } from "./FilterQuery.js";

export interface ReplayQuery<E extends BaseEventType> extends FilterQuery<E> {
  backwards?: boolean;
  limit?: number;
}
