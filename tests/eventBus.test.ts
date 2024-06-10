import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import {
  eventSchema,
  type EventInputType,
  type EventType,
} from "./__mocks__/events";

let em: EM<EventType, EventInputType>;
let capturedLogs: string[] = [];

beforeEach(async () => {
  capturedLogs = [];

  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
  });
});

test("Basic Event Bus", async () => {
  const constant_date = new Date().toISOString();
  em.subscribe({}, async (event) => {
    if (event.type === "page-visited") {
      capturedLogs.push(
        `Page visited: ${event.payload.url} at date: ${event.payload.visitedDate}`
      );
    }
  });
  const event: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: constant_date,
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  await em.emit(event);
  expect(capturedLogs.length).toBe(1);
  expect(capturedLogs[0]).toBe(
    `Page visited: https://example.com at date: ${event.payload.visitedDate}`
  );
});

test("Emit only after subscription", async () => {
  const constant_date = new Date().toISOString();
  const event: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: constant_date,
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  await em.emit(event);
  em.subscribe({}, async (event) => {
    if (event.type === "page-visited") {
      capturedLogs.push(
        `Page visited: ${event.payload.url} at date: ${event.payload.visitedDate}`
      );
    }
  });
  const event2: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: constant_date,
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  await em.emit(event2);
  expect(capturedLogs.length).toBe(1);
  expect(capturedLogs[0]).toBe(
    `Page visited: https://example.com at date: ${event.payload.visitedDate}`
  );
});

test("Persistant subscription", async () => {
  const constant_date = new Date().toISOString();
  const event: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: constant_date,
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  await em.emit(event);
  em.subscribe({}, async (event) => {
    if (event.type === "page-visited") {
      capturedLogs.push(
        `Page visited: ${event.payload.url} at date: ${event.payload.visitedDate}`
      );
    }
  });
  const event2: EventInputType = {
    type: "page-visited",
    streamId: "page-1",
    payload: {
      url: "https://example.com",
      visitedDate: constant_date,
      html: "<html></html>",
      htmlStatus: 200,
    },
  };

  await em.emit(event2);
  expect(capturedLogs.length).toBe(1);
  expect(capturedLogs[0]).toBe(
    `Page visited: https://example.com at date: ${event.payload.visitedDate}`
  );
});
