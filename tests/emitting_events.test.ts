import { expect, test } from "bun:test";
import { EM } from "./../src/EM";
import { InMemoryRepository } from "../src/repos/InMemory.repository";
import {
  eventSchema,
  type EventInputType,
  type EventType,
} from "./../src/examples/events/events";
import { PageVisitedEventUpgrader } from "../src/examples/upgraders/PageVisited.event-upgrader";
import type { EventUpgrader } from "../src/interfaces/Upgrader.interface";
import { EventBus } from "../src/EventBus";
import type { EventHandler } from "../src/interfaces/EventHandler.type";

const upgraders: Array<EventUpgrader<EventType>> = [
  new PageVisitedEventUpgrader(),
];

const pageVisitedHandler: EventHandler<EventType> = async (event) => {
  if (event.type === "page-visited") {
    console.log(
      `Page visited: ${event.payload.url} at date: ${event.payload.visited_date}`
    );
  }
};

// Create an EventBus and register handlers
const eventBus = new EventBus<EventType>();
eventBus.subscribe(pageVisitedHandler);

const em = new EM<EventType, EventInputType>({
  events: eventSchema,
  eventBus,
  upgraders,
});

test("Events Emitting and Replay", async () => {
  const events: EventInputType[] = [
    {
      type: "page-visited",
      entityId: "page-1",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html></html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      entityId: "page-2",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html> Random page</html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      entityId: "page-1",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html>2</html>",
        html_status: 200,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }
  console.log("Replayed Events...");
  const replay: EventType[] = [];
  for await (const event of em.replay({
    entityId: "page-1",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }
  expect(replay.length).toBe(2);
  expect(replay.map((i) => i.seq)).toStrictEqual([1, 3]);
  expect(replay.map((i) => i.version)).toStrictEqual([2, 2]);
});
