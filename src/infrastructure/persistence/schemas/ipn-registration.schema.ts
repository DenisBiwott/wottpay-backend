import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class IpnRegistration extends Document {
  createdAt: Date;
  updatedAt: Date;
  @Prop({ required: true, index: true })
  businessId: string;

  @Prop({ required: true, index: true })
  ipnId: string;

  @Prop({ required: true, index: true })
  url: string;

  @Prop({ required: true })
  notificationType: string;
}

export const IpnRegistrationSchema =
  SchemaFactory.createForClass(IpnRegistration);
