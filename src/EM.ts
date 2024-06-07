import { ZodUnion, z, type ZodTypeAny } from "zod";
import type { Repository } from "./interfaces/Repository.interface";
import type { BaseEventType, BaseInputEventType } from "./events/base.event";
import type { Logger } from "./interfaces/Logger.interface";
import { VoidLogger } from "./loggers/Void.logger";
import type { ProjectionQuery } from "./interfaces/ProjectionQuery";

/**
 * The EM class represents the Event Master.
 */
export class EM<
  Event extends BaseEventType,
  InputEvent extends BaseInputEventType
> {
  private events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>;
  private repo: Repository<Event>;
  private logger: Logger<Event> = new VoidLogger();

  constructor(
    events: ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>,
    repo: Repository<Event>,
    logger?: Logger<Event>
  ) {
    this.events = events;
    this.repo = repo;
    this.logger;
    if (logger) {
      this.logger = logger;
    }
  }

  public async emit(event: InputEvent) {
    const parsedEvent = this.events.parse(event) as Event;
    await this.repo.emitEvent(parsedEvent);
    await this.logger.logEvent(parsedEvent);
  }

  public async *projection(
    query: ProjectionQuery<Event>
  ): AsyncIterable<Event> {
    for await (const event of this.repo.projection(query)) {
      yield event;
      await this.logger.logProjectionItem(query, event);
    }
  }
}
