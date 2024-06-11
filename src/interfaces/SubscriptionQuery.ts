import type { BaseEventType } from "../events/base.event.js";
import type { FilterQuery } from "./FilterQuery.js";

export type SubscriptionQuery<E extends BaseEventType> = FilterQuery<E>;
