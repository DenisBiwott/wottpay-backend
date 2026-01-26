import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog as EventLogDocument } from 'src/infrastructure/persistence/schemas/event-log.schema';
import { EventLog } from 'src/domain/entities/event-log.entity';
import {
  IEventLogRepository,
  EventLogFindOptions,
} from 'src/domain/repositories/event-log.repo';

@Injectable()
export class EventLogRepository implements IEventLogRepository {
  constructor(
    @InjectModel(EventLogDocument.name)
    private eventLogModel: Model<EventLogDocument>,
  ) {}

  async save(eventLog: EventLog): Promise<EventLog> {
    const doc = new this.eventLogModel({
      action: eventLog.action,
      userId: eventLog.userId,
      businessId: eventLog.businessId,
      resourceType: eventLog.resourceType,
      resourceId: eventLog.resourceId,
      metadata: eventLog.metadata,
    });
    const savedDoc = await doc.save();
    return this.toDomainEntity(savedDoc);
  }

  async findByBusinessId(
    businessId: string,
    options?: EventLogFindOptions,
  ): Promise<EventLog[]> {
    const docs = await this.eventLogModel
      .find({ businessId })
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50)
      .exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  private toDomainEntity(doc: EventLogDocument): EventLog {
    return new EventLog(
      doc._id.toString(),
      doc.action,
      doc.userId,
      doc.businessId,
      doc.resourceType,
      doc.resourceId,
      doc.metadata,
      doc.createdAt,
    );
  }
}
