import { expect, test, beforeEach } from "bun:test";
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

test("Emit Events and Validate Emission", async () => {
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

  expect(await Array.fromAsync(em.getAllEvents())).toHaveLength(3);
});

test("Emit Invalid Event", async () => {
  const invalidEvent = {
    id: uuid(),
    type: "invalid-type",
    entityId: "page-1",
    payload: {
      url: "invalid-url",
      visitedDate: "not-a-date",
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  expect(em.emit(invalidEvent as any)).rejects.toThrow();
});

test("Emit Invalid Event - 2", async () => {
  const invalidEvent = {
    id: uuid(),
    type: "page-visited",
    entityId: 42,
    payload: {
      url: "invalid-url",
      visitedDate: "not-a-date",
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  expect(em.emit(invalidEvent as any)).rejects.toThrow();
});

test("Emit Event with Same ID Twice", async () => {
  const uuidString = uuid();
  const event: EventInputType = {
    id: uuidString,
    type: "page-visited",
    entityId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: new Date().toISOString(),
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  await em.emit(event);
  expect(em.emit(event)).rejects.toThrow();
});

// Fake test for `subscribeToStream`
test.skip("Fake Test", async () => {
  // @ts-expect-error: Method does not exist yet
  await em.nonExistingMethod("example-name");

  // Assuming there will be some assertions here
  expect(true).toBe(true);
});
