# Event Master

Event Master is an Event Sourcing library that abstracts working with events and supports multiple data storage backends (repositories). It provides a flexible and extensible framework for managing events, projections, and event versioning. The library is designed to be easy to use and integrate into your existing applications.

## Documentation

### Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Setup](#setup)
4. [Examples](#examples)
   - [Defining an Event](#defining-an-event)
   - [Emitting Events](#emitting-events)
   - [Replaying Events](#replaying-events)
5. [Basic Use-Cases](#basic-use-cases)
   - [Custom Repositories](#custom-repositories)
   - [Custom Loggers](#custom-loggers)
   - [Event Upgraders](#event-upgraders)
6. [Advanced Features](#advanced-features)
   - [Handling Multiple Event Types](#handling-multiple-event-types)
   - [Event Projections](#event-projections)

## Introduction

Event Master is an Event Sourcing library that abstracts working with events and supports multiple data storage backends (repositories). It provides a flexible and extensible framework for managing events, projections, and event versioning. The library is designed to be easy to use and integrate into your existing applications.

## Installation

To install Event Master, run the following command:

```bash
npm install @kolarski/event-master
```

## Setup

To use Event Master in your project, you need to define your events first.
This is done using the Zod library (https://zod.dev/).
That way not only you are getting an a TypeScript type safty but also you are getting,
runtime safety as well, thanks to Zod's parsers.
Zod is already included in the project, no need to install it seperatly.
You just need to extend the baseEvent already defined in the project with your custom payload

```typescript
import { EM, baseEvent, z } from "@kolarski/event-master";

// Define your event schema
const pageVisitedEvent = baseEvent
  .extend({
    type: z.literal("page-visited"),
    payload: z.object({
      url: z.string().url(),
      visited_date: z.string().datetime(),
    }),
  })
  .readonly();

const pageMissingEvent = baseEvent
  .extend({
    type: z.literal("page-missing"),
    payload: z.object({
      url: z.string().url(),
      visited_date: z.string().datetime(),
    }),
  })
  .readonly();

const eventSchema = z.union([pageVisitedEvent, pageMissingEvent]);

// Create an instance of EM with the required configurations
const em = EM.create({
  events: eventSchema,
});
```

## Examples

### Defining an Event

Define a custom event using Zod and the base event schema.

```typescript
import { baseEvent, z } from "@kolarski/event-master";

const pageVisitedEvent = baseEvent
  .extend({
    type: z.literal("page-visited"),
    payload: z.object({
      url: z.string().url(),
      visited_date: z.string().datetime(),
    }),
  })
  .readonly();

export { pageVisitedEvent };
```

### Emitting Events

Emit events using the EM instance.

```typescript
const event = {
  type: "page-visited",
  aggregateId: "page-1",
  payload: {
    url: "https://example.com",
    visited_date: new Date().toISOString(),
  },
};

em.emit(event).then(() => console.log("Event emitted"));
```

### Replaying Events

Replay events to reconstruct application state.

```typescript
async function replayEvents() {
  for await (const event of em.replay({ aggregateId: "page-1" })) {
    console.log(`Replayed event: ${event.type} at ${event.seq}`);
  }
}

replayEvents();
```

### Basic Use-Cases

#### Custom Repositories

You can use custom repositories by implementing the `Repository` interface and passing an instance to the EM configuration.

```typescript
import { EM } from "@kolarski/event-master";
import type { Repository } from "@kolarski/event-master";
import type { BaseEventType } from "@kolarski/event-master";

class CustomRepository<Event extends BaseEventType>
  implements Repository<Event>
{
  private events: Array<Readonly<Event>> = [];
  private currentSeq: number = 0;

  async emitEvent(event: Event): Promise<void> {
    event.seq = ++this.currentSeq;
    this.events.push(event);
  }

  async *replay(query: ReplayQuery<Event>): AsyncIterable<Event> {
    for (const event of this.events) {
      if (query.aggregateId && event.aggregateId !== query.aggregateId)
        continue;
      if (query.seq && query.seq.from && event.seq < query.seq.from) continue;
      if (query.seq && query.seq.to && event.seq > query.seq.to) continue;
      yield event;
    }
  }

  async getAllEvents(): Promise<Array<Event>> {
    return this.events;
  }

  async getLastProcessedEventId(
    projectionName: string
  ): Promise<string | null> {
    return null;
  }
}

// Use the custom repository in the EM instance
const em = EM.create({
  events: eventSchema,
  repository: new CustomRepository(),
});
```

#### Custom Loggers

Custom loggers can be integrated by implementing the `Logger` interface and passing an instance to the EM configuration.

```typescript
import { EM } from "@kolarski/event-master";
import type {
  Logger,
  ProjectionQuery,
  BaseEventType,
} from "@kolarski/event-master";

class CustomLogger<Event extends BaseEventType> implements Logger<Event> {
  async logEvent(event: Event): Promise<void> {
    console.log(`Custom log: Event emitted - ${event.type}`);
  }

  async logProjectionItem(
    query: ProjectionQuery<Event>,
    event: Event
  ): Promise<void> {
    console.log(
      `Custom log: Projection query - ${JSON.stringify(query)}, Event - ${
        event.type
      }`
    );
  }
}

// Use the custom logger in the EM instance
const em = EM.create({
  events: eventSchema,
  logger: new CustomLogger(),
});
```

#### Event Upgraders

Event upgraders help in handling changes in event structure over time. Implement the `EventUpgrader` interface and pass an array of upgraders to the EM configuration.

```typescript
import { EM } from "@kolarski/event-master";
import type { EventUpgrader } from "@kolarski/event-master";
import { z } from "zod";

const PageVisitedEvent = z.object({
  type: z.literal("page-visited"),
  version: z.literal(1),
  aggregateId: z.string(),
  payload: z.object({
    url: z.string().url(),
    visited_date: z.string().datetime(),
  }),
});

const PageVisitedV2Event = z.object({
  type: z.literal("page-visited"),
  version: z.literal(2),
  aggregateId: z.string(),
  payload: z.object({
    url: z.string().url(),
    visited_date: z.string().datetime(),
    userAgent: z.string().default("unknown"),
  }),
});

class PageVisitedEventUpgrader
  implements EventUpgrader<typeof PageVisitedEvent>
{
  upgrade(event: typeof PageVisitedEvent): typeof PageVisitedV2Event {
    if (event.version === 1) {
      return {
        ...event,
        version: 2,
        payload: {
          ...event.payload,
          userAgent: "unknown",
        },
      };
    }
    return event;
  }

  downgrade(event: typeof PageVisitedV2Event): typeof PageVisitedEvent {
    if (event.version === 2) {
      const { userAgent, ...restPayload } = event.payload;
      return {
        ...event,
        version: 1,
        payload: restPayload,
      };
    }
    return event;
  }
}

// Use the event upgrader in the EM instance
const em = EM.create({
  events: eventSchema,
  upgraders: [new PageVisitedEventUpgrader()],
});
```

If you create something useful, please consider contributing it to the project by submitting a pull request. Your contributions are welcome and help the community grow!

### Advanced Features

#### Handling Multiple Event Types

Event Master supports handling multiple event types by defining a union of event schemas.

```typescript
import { EM, baseEvent, z } from "@kolarski/event-master";

const pageVisitedEvent = baseEvent
  .extend({
    type: z.literal("page-visited"),
    payload: z.object({
      url: z.string().url(),
      visited_date: z.string().datetime(),
    }),
  })
  .readonly();

const userRegisteredEvent = baseEvent
  .extend({
    type: z.literal("user-registered"),
    payload: z.object({
      userId: z.string().uuid(),
      registeredAt: z.string().datetime(),
    }),
  })
  .readonly();

const eventSchema = z.union([pageVisitedEvent, userRegisteredEvent]);

const em = EM.create({
  events: eventSchema,
});
```

#### Event Projections

Event projections allow you to create derived data by replaying events.

```typescript
async function projectEvents() {
  const projection = {};

  for await (const event of em.replay({ aggregateId: "page-1" })) {
    // Update the projection based on the event
    if (event.type === "page-visited") {
      projection[event.aggregateId] = projection[event.aggregateId] || [];
      projection[event.aggregateId].push(event.payload);
    }
  }

  console.log(projection);
}

projectEvents();
```
