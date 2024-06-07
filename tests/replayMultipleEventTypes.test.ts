import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { PageVisitedEventUpgrader } from "./__mocks__/PageVisitedEventUpgrader";
import { EventBus } from "../src/EventBus";

let em: EM<EventType, EventInputType>;
let replay: EventType[] = [];

const upgraders = [new PageVisitedEventUpgrader()];

beforeEach(() => {
  replay = [];
  const eventBus = new EventBus<EventType>();
  em = new EM<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
    upgraders,
  });
});

test("Replay with Multiple Event Types", async () => {
  const events: EventInputType[] = [
    {
      type: "page-visited",
      aggregateId: "page-1",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html></html>",
        html_status: 200,
      },
    },
    {
      type: "broken-link",
      aggregateId: "page-1",
      payload: {
        url: "https://bad-link.com",
        visited_date: new Date().toISOString(),
        html_status: 404,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    aggregateId: "page-1",
    eventTypes: ["page-visited", "broken-link"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(2);
});
