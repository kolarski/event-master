import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";

let em: EM<EventType, EventInputType>;
let capturedLogs: string[] = [];

beforeEach(async () => {
  capturedLogs = [];

  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
  });
  em.subscribe(async (event) => {
    if (event.type === "page-visited") {
      capturedLogs.push(
        `Page visited: ${event.payload.url} at date: ${event.payload.visited_date}`
      );
    }
  });
});

test("Event Bus and Logging", async () => {
  const event: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visited_date: new Date().toISOString(),
      html: "<html></html>",
      html_status: 200,
    },
  };

  await em.emit(event);
  expect(capturedLogs.length).toBe(1);
  expect(capturedLogs[0]).toBe(
    `Page visited: https://example.com at date: ${event.payload.visited_date}`
  );
});
