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

test("Emit Events and Validate Emission", async () => {
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

  expect(await Array.fromAsync(em.getAllEvents())).toHaveLength(3);
});

test("Emit Invalid Event", async () => {
  const invalidEvent = {
    type: "invalid-type",
    streamId: "page-1",
    payload: {
      url: "invalid-url",
      visited_date: "not-a-date",
      html: "<html></html>",
      html_status: 200,
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
      visited_date: "not-a-date",
      html: "<html></html>",
      html_status: 200,
    },
  };

  expect(em.emit(invalidEvent as any)).rejects.toThrow();
});
