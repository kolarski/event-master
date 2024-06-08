import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { EventBus } from "../src/EventBus";

let em: EM<EventType, EventInputType>;
let replay: EventType[] = [];

beforeEach(async () => {
  replay = [];
  const eventBus = new EventBus<EventType>();
  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
  });
});

test("Events Replay", async () => {
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
      type: "page-visited",
      aggregateId: "page-2",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html> Random page</html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      aggregateId: "page-1",
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
    aggregateId: "page-1",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(2);
  expect(replay.map((i) => i.seq)).toStrictEqual([1, 3]);

  expect(await em.getAllStreams()).toStrictEqual([
    {
      id: "page-1",
      seq: 1,
      type: "page-visited",
    },
    {
      id: "page-2",
      seq: 0,
      type: "page-visited",
    },
  ]);

  expect(
    em.emit({
      type: "page-visited",
      aggregateId: "page-1",
      expected_stream_seq: 0,
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html>2</html>",
        html_status: 200,
      },
    })
  ).rejects.toThrow();

  await em.emit({
    type: "page-visited",
    aggregateId: "page-1",
    expected_stream_seq: 1,
    payload: {
      url: "https://example.com",
      visited_date: new Date().toISOString(),
      html: "<html>2</html>",
      html_status: 200,
    },
  });

  expect(await em.getAllStreams()).toStrictEqual([
    {
      id: "page-1",
      seq: 2,
      type: "page-visited",
    },
    {
      id: "page-2",
      seq: 0,
      type: "page-visited",
    },
  ]);
});
