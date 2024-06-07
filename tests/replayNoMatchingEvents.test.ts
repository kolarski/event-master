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

test("Replay with No Matching Events", async () => {
  const event: EventInputType = {
    type: "page-visited",
    entityId: "page-1",
    payload: {
      url: "https://example.com",
      visited_date: new Date().toISOString(),
      html: "<html></html>",
      html_status: 200,
    },
    version: 1,
  };

  await em.emit(event);

  for await (const event of em.replay({
    entityId: "non-existing-id",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(0);
});
