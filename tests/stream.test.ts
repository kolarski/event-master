import { expect, test, beforeEach } from "bun:test";
import { EM } from "../src/EM";
import {
  eventSchema,
  type EventInputType,
  type EventType,
} from "./__mocks__/events";

let em: EM<EventType, EventInputType>;

beforeEach(async () => {
  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
  });
});

test("Emit Events and Check Streams", async () => {
  const events: EventInputType[] = [
    {
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
      entityId: "page-1",
      expectedLastEntityId: 0,
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html>2</html>",
        htmlStatus: 200,
      },
    })
  ).rejects.toThrow();

  await em.emit({
    type: "page-visited",
    entityId: "page-1",
    expectedLastEntityId: 1,
    payload: {
      url: "https://example.com",
      visitedDate: new Date().toISOString(),
      html: "<html>2</html>",
      htmlStatus: 200,
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
      entityId: "page-2",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html></html>",
        htmlStatus: 200,
      },
    },
    {
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
    entityId: "page-2",
    expectedLastEntityId: 0,
    payload: {
      url: "https://example.com/page2",
      visitedDate: new Date().toISOString(),
      html: "<html>2</html>",
      htmlStatus: 200,
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
