import { expect, test, beforeEach } from "bun:test";
import { EM } from "./../src/EM";
import { eventSchema, EventInputType, EventType } from "./__mocks__/events";
import { PageVisitedEventUpgrader } from "./__mocks__/PageVisitedEventUpgrader";
import { EventBus } from "../src/EventBus";

let em: EM<EventType, EventInputType>;

const upgraders = [new PageVisitedEventUpgrader()];

beforeEach(async () => {
  const eventBus = new EventBus<EventType>();
  em = await EM.create<EventType, EventInputType>({
    events: eventSchema,
    eventBus,
    upgraders,
  });
});

test("Emit Invalid Event", async () => {
  const invalidEvent = {
    type: "invalid-type",
    aggregateId: "page-1",
    payload: {
      url: "invalid-url",
      visited_date: "not-a-date",
      html: "<html></html>",
      html_status: 200,
    },
  };

  expect(em.emit(invalidEvent as any)).rejects.toThrow();
});

test("Emit Invalid Event", async () => {
  const invalidEvent = {
    type: "page-visited",
    aggregateId: 42,
    payload: {
      url: "invalid-url",
      visited_date: "not-a-date",
      html: "<html></html>",
      html_status: 200,
    },
  };

  expect(em.emit(invalidEvent as any)).rejects.toThrow();
});
