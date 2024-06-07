import { PageVisitedEvent, PageVisitedV2Event, type EventType } from "./events";
import { type EventUpgrader } from "../../src/interfaces/Upgrader.interface";

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
