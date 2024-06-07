import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "path";
import type { BaseEventType } from "../events/base.event";
import type { ProjectionQuery } from "../interfaces/ProjectionQuery";
import type { Repository } from "../interfaces/Repository.interface";

export class FileRepository<Event extends BaseEventType>
  implements Repository<Event>
{
  private eventsDir: string;
  private projectionsDir: string;

  constructor(eventsDir: string, projectionsDir: string) {
    this.eventsDir = eventsDir;
    this.projectionsDir = projectionsDir;
  }

  private async getEventFilePath(eventId: string): Promise<string> {
    return join(this.eventsDir, `${eventId}.json`);
  }

  private async getProjectionFilePath(projectionName: string): Promise<string> {
    return join(this.projectionsDir, `${projectionName}.json`);
  }

  public async emitEvent(event: Event): Promise<void> {
    const eventFilePath = await this.getEventFilePath(event.id);
    await writeFile(eventFilePath, JSON.stringify(event, null, 2));
  }

  public async *projection(
    query: ProjectionQuery<Event>
  ): AsyncIterable<Event> {
    const files = await readdir(this.eventsDir);
    const events: Event[] = [];

    for (const file of files) {
      const filePath = join(this.eventsDir, file);
      const event = JSON.parse(await readFile(filePath, "utf-8")) as Event;

      if (query.entityId && event.entityId !== query.entityId) {
        continue;
      }
      if (query.eventTypes && !query.eventTypes.includes(event.type)) {
        continue;
      }
      if (query.payload) {
        let matches = true;
        for (const key in query.payload) {
          if (query.payload[key] !== event.payload[key]) {
            matches = false;
            break;
          }
        }
        if (!matches) {
          continue;
        }
      }
      if (query.createdAt) {
        if (query.createdAt.from && event.createdAt < query.createdAt.from) {
          continue;
        }
        if (query.createdAt.to && event.createdAt > query.createdAt.to) {
          continue;
        }
      }
      events.push(event);
    }

    events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const event of events) {
      yield event;
    }
  }

  public async getAllEvents(): Promise<Event[]> {
    const files = await readdir(this.eventsDir);
    const events: Event[] = [];

    for (const file of files) {
      const filePath = join(this.eventsDir, file);
      const event = JSON.parse(await readFile(filePath, "utf-8")) as Event;
      events.push(event);
    }

    return events;
  }

  public async saveLastProcessedEventId(
    projectionName: string,
    eventId: string
  ): Promise<void> {
    const projectionFilePath = await this.getProjectionFilePath(projectionName);
    await writeFile(
      projectionFilePath,
      JSON.stringify(
        {
          lastProcessedEventId: eventId,
        },
        null,
        2
      )
    );
  }

  public async getLastProcessedEventId(
    projectionName: string
  ): Promise<string | null> {
    const projectionFilePath = await this.getProjectionFilePath(projectionName);
    try {
      const data = JSON.parse(await readFile(projectionFilePath, "utf-8"));
      return data.lastProcessedEventId || null;
    } catch (error) {
      if (error instanceof Error && (error as any).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
}
