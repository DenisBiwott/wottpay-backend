import { Injectable, Inject } from '@nestjs/common';
import { EventLog } from 'src/domain/entities/event-log.entity';
import type { IEventLogRepository } from 'src/domain/repositories/event-log.repo';
import { EventAction } from 'src/domain/enums/event-action.enum';

@Injectable()
export class EventLogService {
  constructor(
    @Inject('IEventLogRepository')
    private readonly eventLogRepository: IEventLogRepository,
  ) {}

  async logEvent(
    action: EventAction,
    userId: string,
    businessId: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any> = {},
  ): Promise<EventLog> {
    const eventLog = new EventLog(
      '',
      action,
      userId,
      businessId,
      resourceType,
      resourceId,
      metadata,
      new Date(),
    );
    return this.eventLogRepository.save(eventLog);
  }

  async getEventsByBusiness(
    businessId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<EventLog[]> {
    const skip = (page - 1) * limit;
    return this.eventLogRepository.findByBusinessId(businessId, {
      skip,
      limit,
    });
  }
}
