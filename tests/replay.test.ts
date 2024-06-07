import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { EventBus } from "../src/EventBus";

let em: EM<EventType, EventInputType>;
let replay: EventType[] = [];

beforeEach(() => {
  replay = [];
  const eventBus = new EventBus<EventType>();
  em = new EM<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
  });
});

test("Events Replay", async () => {
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

  for await (const event of em.replay({
    entityId: "page-1",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(2);
  expect(replay.map((i) => i.seq)).toStrictEqual([1, 3]);
});
