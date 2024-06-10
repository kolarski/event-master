import { expect, test, beforeEach } from "bun:test";
import { EM } from "../src/EM";
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

test("Replay with No Matching Events", async () => {
  const event: EventInputType = {
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

  await em.emit(event);

  for await (const event of em.replay({
    streamId: "non-existing-id",
    eventTypes: ["page-visited"],
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(0);
});

test("Replay with Sequence Range", async () => {
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
      seq: 1,
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page2",
        visitedDate: new Date().toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
      seq: 2,
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page3",
        visitedDate: new Date().toISOString(),
        html: "<html>3</html>",
        htmlStatus: 200,
      },
      seq: 3,
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    streamId: "page-1",
    seq: { from: 2, to: 3 },
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(2);
  expect(replay.map((e) => e.seq)).toStrictEqual([2, 3]);
});

test("Replay with Specific Payload", async () => {
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
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page2",
        visitedDate: new Date().toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page3",
        visitedDate: new Date().toISOString(),
        html: "<html>3</html>",
        htmlStatus: 200,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    streamId: "page-1",
    payload: { url: "https://example.com/page2" },
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(1);
  expect(replay[0]?.payload.url).toBe("https://example.com/page2");
});

test("Replay with CreatedAt Range", async () => {
  const now = new Date();
  const events: EventInputType[] = [
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: now.toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
      createdAt: new Date(now.getTime() - 10000), // 10 seconds ago
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page2",
        visitedDate: now.toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
      createdAt: now,
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    streamId: "page-1",
    createdAt: { from: new Date(now.getTime() - 5000) }, // last 5 seconds
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(1);
  expect(replay[0]?.payload.url).toBe("https://example.com/page2");
});

test("Replay with CreatedAt From and To Range", async () => {
  const now = new Date();
  const events: EventInputType[] = [
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: now.toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
      createdAt: new Date(now.getTime() - 20000), // 20 seconds ago
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page2",
        visitedDate: now.toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
      createdAt: new Date(now.getTime() - 10000), // 10 seconds ago
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page3",
        visitedDate: now.toISOString(),
        html: "<html>3</html>",
        htmlStatus: 200,
      },
      createdAt: now,
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    streamId: "page-1",
    createdAt: {
      from: new Date(now.getTime() - 15000),
      to: new Date(now.getTime() - 5000),
    }, // 15 seconds ago to 5 seconds ago
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(1);
  expect(replay[0]?.payload.url).toBe("https://example.com/page2");
});

test("Replay with Multiple Filters", async () => {
  const now = new Date();
  const events: EventInputType[] = [
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: now.toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
      createdAt: new Date(now.getTime() - 20000), // 20 seconds ago
    },
    {
      type: "broken-link",
      streamId: "page-1",
      payload: {
        url: "https://bad-link.com",
        visitedDate: now.toISOString(),
        htmlStatus: 404,
      },
      createdAt: new Date(now.getTime() - 15000), // 15 seconds ago
    },
    {
      type: "page-visited",
      streamId: "page-1",
      payload: {
        url: "https://example.com/page2",
        visitedDate: now.toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
      createdAt: new Date(now.getTime() - 10000), // 10 seconds ago
    },
    {
      type: "page-visited",
      streamId: "page-2",
      payload: {
        url: "https://example.com/page3",
        visitedDate: now.toISOString(),
        html: "<html>3</html>",
        htmlStatus: 200,
      },
      createdAt: now,
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  for await (const event of em.replay({
    streamId: "page-1",
    eventTypes: ["page-visited"],
    seq: { from: 2 },
    createdAt: { from: new Date(now.getTime() - 15000) }, // last 15 seconds
  })) {
    replay.push(event);
  }

  expect(replay.length).toBe(1);
  expect(replay[0]?.payload.url).toBe("https://example.com/page2");
});
