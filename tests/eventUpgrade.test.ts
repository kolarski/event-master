import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { PageVisitedEventUpgrader } from "./__mocks__/PageVisitedEventUpgrader";
import { EventBus } from "../src/EventBus";

let em: EM<EventType, EventInputType>;
let replay: EventType[] = [];

const eventBus = new EventBus<EventType>();
const upgraders = [new PageVisitedEventUpgrader()];

beforeEach(() => {
  replay = [];
  em = new EM<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
    upgraders,
  });
});

test("Event Upgrading", async () => {
  const oldEvent: EventInputType = {
    type: "page-visited",
    aggregateId: "page-1",
    payload: {
      url: "https://example.com",
      visited_date: new Date().toISOString(),
      html: "<html></html>",
      html_status: 200,
    },
    version: 1,
  };

  await em.emit(oldEvent);

  for await (const event of em.replay({
    aggregateId: "page-1",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(1);
  expect(replay[0].version).toBe(2);
  expect((replay[0] as any).payload.userAgent).toBe("unknown");
});
