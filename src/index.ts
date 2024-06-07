import { EM } from "./EM";
import { InMemoryRepository } from "./repos/InMemory.repository";
import {
  eventSchema,
  type EventInputType,
  type EventType,
} from "./examples/events/events";
import { EventBus } from "./EventBus";

const em = new EM<EventType, EventInputType>(
  eventSchema,
  new InMemoryRepository(),
  [],
  new EventBus<EventType>()
);
await em.emit({
  type: "page-visited",
  entityId: "page-1",
  payload: {
    url: "https://example.com",
    visited_date: new Date().toISOString(),
    html: "<html></html>",
    html_status: 200,
  },
});
await em.emit({
  type: "page-visited",
  entityId: "page-2",
  payload: {
    url: "https://example.com",
    visited_date: new Date().toISOString(),
    html: "<html> Random page</html>",
    html_status: 200,
  },
});

await em.emit({
  type: "page-visited",
  entityId: "page-1",
  payload: {
    url: "https://example.com",
    visited_date: new Date().toISOString(),
    html: "<html>2</html>",
    html_status: 200,
  },
});

console.log("Projection...");
const project = em.replay({
  eventTypes: ["page-visited"],
});
console.log(project);
