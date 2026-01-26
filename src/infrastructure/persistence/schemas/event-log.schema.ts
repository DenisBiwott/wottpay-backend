import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class EventLog extends Document {
  createdAt: Date;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  businessId: string;

  @Prop({ required: true })
  resourceType: string;

  @Prop({ required: true })
  resourceId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);

EventLogSchema.index({ createdAt: -1 });
EventLogSchema.index({ businessId: 1, createdAt: -1 });
