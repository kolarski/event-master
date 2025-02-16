import { expect, test, beforeEach } from "vitest";
import { EM } from "../src/EM";
import {
  eventSchema,
  type EventInputType,
  type EventType,
} from "./__mocks__/events";
import { v4 as uuid } from "uuid";

let em: EM<EventType, EventInputType>;

beforeEach(async () => {
  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
  });
});

test("Emit Events and Check Streams", async () => {
  const events: EventInputType[] = [
    {
      id: uuid(),
      type: "page-visited",
      entityId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
    },
    {
      id: uuid(),
      type: "page-visited",
      entityId: "page-2",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html> Random page</html>",
        htmlStatus: 200,
      },
    },
    {
      id: uuid(),
      type: "page-visited",
      entityId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  expect(await Array.fromAsync(em.getAllEntityStreams())).toStrictEqual([
    {
      id: "page-1",
      entityId: "page-1",
      lastEventSeq: 2,
      eventTypes: ["page-visited"],
    },
    {
      id: "page-2",
      entityId: "page-2",
      lastEventSeq: 1,
      eventTypes: ["page-visited"],
    },
  ]);

  expect(
    em.emit({
      id: uuid(),
      type: "page-visited",
      entityId: "page-1",
      expectedLastEntitySeq: 0,
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
    })
  ).rejects.toThrow();

  await em.emit({
    id: uuid(),
    type: "page-visited",
    entityId: "page-1",
    expectedLastEntitySeq: 2,
    payload: {
      url: "https://example.com",
      visitedDate: new Date().toISOString(),
      html: "<html>2</html>",
      htmlStatus: 200,
    },
  });

  expect(await Array.fromAsync(em.getAllEntityStreams())).toStrictEqual([
    {
      id: "page-1",
      entityId: "page-1",
      lastEventSeq: 4,
      eventTypes: ["page-visited"],
    },
    {
      id: "page-2",
      entityId: "page-2",
      lastEventSeq: 1,
      eventTypes: ["page-visited"],
    },
  ]);
});

test("Emit Events in Reverse Order and Check Streams", async () => {
  const events: EventInputType[] = [
    {
      id: uuid(),
      type: "page-visited",
      entityId: "page-2",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
    },
    {
      id: uuid(),
      type: "page-visited",
      entityId: "page-1",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
    },
    {
      id: uuid(),
      type: "page-visited",
      entityId: "page-1",
      payload: {
        url: "https://example.com/page1",
        visitedDate: new Date().toISOString(),
        html: "<html>1</html>",
        htmlStatus: 200,
      },
    },
  ];

  for (const event of events) {
    await em.emit(event);
  }

  expect(await Array.fromAsync(em.getAllEntityStreams())).toStrictEqual([
    {
      id: "page-2",
      entityId: "page-2",
      lastEventSeq: 0,
      eventTypes: ["page-visited"],
    },
    {
      id: "page-1",
      entityId: "page-1",
      lastEventSeq: 2,
      eventTypes: ["page-visited"],
    },
  ]);

  await em.emit({
    id: uuid(),
    type: "page-visited",
    entityId: "page-2",
    expectedLastEntitySeq: 0,
    payload: {
      url: "https://example.com/page2",
      visitedDate: new Date().toISOString(),
      html: "<html>2</html>",
      htmlStatus: 200,
    },
  });

  expect(await Array.fromAsync(em.getAllEntityStreams())).toStrictEqual([
    {
      id: "page-2",
      entityId: "page-2",
      lastEventSeq: 3,
      eventTypes: ["page-visited"],
    },
    {
      id: "page-1",
      entityId: "page-1",
      lastEventSeq: 2,
      eventTypes: ["page-visited"],
    },
  ]);
});
