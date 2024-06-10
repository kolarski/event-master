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

test("Emit Events and Validate Emission", async () => {
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
      streamId: "page-2",
      payload: {
        url: "https://example.com",
        visitedDate: new Date().toISOString(),
        html: "<html> Random page</html>",
        htmlStatus: 200,
      },
    },
    {
      type: "page-visited",
      streamId: "page-1",
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
    type: "invalid-type",
    streamId: "page-1",
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
    type: "page-visited",
    streamId: 42,
    payload: {
      url: "invalid-url",
      visitedDate: "not-a-date",
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  expect(em.emit(invalidEvent as any)).rejects.toThrow();
});

// Fake test for `subscribeToStream`
test.skip("Fake Test", async () => {
  // @ts-expect-error: Method does not exist yet
  await em.nonExistingMethod("example-name");

  // Assuming there will be some assertions here
  expect(true).toBe(true);
});
