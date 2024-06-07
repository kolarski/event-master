import { type EventType } from "./../events/events";
import { type EventUpgrader } from "./../../interfaces/Upgrader.interface";

import PageVisitedEvent from "../events/pageVisited.event";
import PageVisitedV2Event from "../events/pageVisited.v2.event";

export class PageVisitedEventUpgrader implements EventUpgrader<EventType> {
  upgrade(event: EventType): EventType {
    if (event.type === "page-visited" && event.version === 1) {
      return PageVisitedV2Event.parse({
        ...event,
        version: 2,
        payload: {
          ...event.payload,
          userAgent: "unknown", // Default value for new field
        },
      });
    }
    return event;
  }

  downgrade(event: EventType): EventType {
    if (event.type === "page-visited" && event.version === 2) {
      const { userAgent, ...restPayload } = event.payload;
      return PageVisitedEvent.parse({
        ...event,
        version: 1,
        payload: restPayload,
      });
    }
    return event;
  }
}
