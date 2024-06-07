import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { PageVisitedEventUpgrader } from "../src/examples/upgraders/PageVisited.event-upgrader";
import { EventBus } from "../src/EventBus";
import type { EventHandler } from "../src/interfaces/EventHandler.type";

let em: EM<EventType, EventInputType>;
let capturedLogs: string[] = [];

const upgraders = [new PageVisitedEventUpgrader()];

const pageVisitedHandler: EventHandler<EventType> = async (event) => {
  if (event.type === "page-visited") {
    capturedLogs.push(
      `Page visited: ${event.payload.url} at date: ${event.payload.visited_date}`
    );
  }
};

beforeEach(() => {
  capturedLogs = [];
  const eventBus = new EventBus<EventType>();
  eventBus.subscribe(pageVisitedHandler);

  em = new EM<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
  });
});

test("Event Bus and Logging", async () => {
  const event: EventInputType = {
    type: "page-visited",
    entityId: "page-1",
    payload: {
      url: "https://example.com",
      visited_date: new Date().toISOString(),
      html: "<html></html>",
      html_status: 200,
    },
  };

  await em.emit(event);
  expect(capturedLogs.length).toBe(1);
  expect(capturedLogs[0]).toBe(
    `Page visited: https://example.com at date: ${event.payload.visited_date}`
  );
});
