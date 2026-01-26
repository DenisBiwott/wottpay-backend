import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventLog,
  EventLogSchema,
} from 'src/infrastructure/persistence/schemas/event-log.schema';
import { EventLogRepository } from 'src/infrastructure/persistence/repositories/event-log.repository';
import { EventLogService } from 'src/application/use-cases/event-logs/event-log.service';
import { EventLogController } from 'src/api/controllers/event-log.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
  ],
  controllers: [EventLogController],
  providers: [
    EventLogService,
    {
      provide: 'IEventLogRepository',
      useClass: EventLogRepository,
    },
  ],
  exports: [EventLogService],
})
export class EventLogModule {}
