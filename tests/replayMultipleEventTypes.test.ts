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

test("Replay with Multiple Event Types", async () => {
  const events: EventInputType[] = [
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
    },
    {
      type: "broken-link",
      streamId: "page-1",
      payload: {
        url: "https://bad-link.com",
        visitedDate: new Date().toISOString(),
        htmlStatus: 404,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    streamId: "page-1",
    eventTypes: ["page-visited", "broken-link"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(2);
});
