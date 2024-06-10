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

test("Event Upgrading", async () => {
  const oldEvent: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: new Date().toISOString(),
      html: "<html></html>",
      htmlStatus: 200,
    },
    version: 1,
  };

  await em.emit(oldEvent);

  for await (const event of em.replay({
    streamId: "page-1",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(1);
  expect(replay[0]?.version).toBe(2);
  expect((replay[0] as any).payload.userAgent).toBe("unknown");
});
