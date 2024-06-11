import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import {
  eventSchema,
  type EventInputType,
  type EventType,
} from "./__mocks__/events";
import { PageVisitedEventUpgrader } from "./__mocks__/PageVisitedEventUpgrader";

let em: EM<EventType, EventInputType>;
let replay: EventType[] = [];

const upgraders = [new PageVisitedEventUpgrader()];

beforeEach(async () => {
  replay = [];
  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
    upgraders,
  });
});

test("Replay with No Matching Events", async () => {
  const event: EventInputType = {
    type: "page-visited",
    entityId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: new Date().toISOString(),
      html: "<html></html>",
      htmlStatus: 200,
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
