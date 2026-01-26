import { EventLog } from '../entities/event-log.entity';

export interface EventLogFindOptions {
  skip?: number;
  limit?: number;
}

export interface IEventLogRepository {
  save(eventLog: EventLog): Promise<EventLog>;
  findByBusinessId(
    businessId: string,
    options?: EventLogFindOptions,
  ): Promise<EventLog[]>;
}
