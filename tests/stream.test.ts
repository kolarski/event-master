import { expect, test, beforeEach } from "bun:test";
import { EM } from "../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { EventBus } from "../src/EventBus";

let em: EM<EventType, EventInputType>;

beforeEach(async () => {
  const eventBus = new EventBus<EventType>();
  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
  });
});

test("Emit Events and Check Streams", async () => {
  const events: EventInputType[] = [
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html></html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      streamId: "page-2",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html> Random page</html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      streamId: "page-1",
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

  expect(await Array.fromAsync(em.getAllStreams())).toStrictEqual([
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
      streamId: "page-1",
      expectedStreamSeq: 0,
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
    streamId: "page-1",
    expectedStreamSeq: 1,
    payload: {
      url: "https://example.com",
      visited_date: new Date().toISOString(),
      html: "<html>2</html>",
      html_status: 200,
    },
  });

  expect(await Array.fromAsync(em.getAllStreams())).toStrictEqual([
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

test("Emit Events in Reverse Order and Check Streams", async () => {
  const events: EventInputType[] = [
    {
      type: "page-visited",
      streamId: "page-2",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html></html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com",
        visited_date: new Date().toISOString(),
        html: "<html>2</html>",
        html_status: 200,
      },
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page1",
        visited_date: new Date().toISOString(),
        html: "<html>1</html>",
        html_status: 200,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  expect(await Array.fromAsync(em.getAllStreams())).toStrictEqual([
    {
      id: "page-2",
      seq: 0,
      type: "page-visited",
    },
    {
      id: "page-1",
      seq: 1,
      type: "page-visited",
    },
  ]);

  await em.emit({
    type: "page-visited",
    streamId: "page-2",
    expectedStreamSeq: 0,
    payload: {
      url: "https://example.com/page2",
      visited_date: new Date().toISOString(),
      html: "<html>2</html>",
      html_status: 200,
    },
  });

  expect(await Array.fromAsync(em.getAllStreams())).toStrictEqual([
    {
      id: "page-2",
      seq: 1,
      type: "page-visited",
    },
    {
      id: "page-1",
      seq: 1,
      type: "page-visited",
    },
  ]);
});
