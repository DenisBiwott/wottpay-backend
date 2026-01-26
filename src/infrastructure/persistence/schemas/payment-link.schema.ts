import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentLink extends Document {
  createdAt: Date;
  updatedAt: Date;
  @Prop({ required: true })
  merchantRef: string;

  @Prop({ required: true, index: true })
  trackingId: string;

  @Prop({ required: true, index: true })
  businessId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  status: string;

  @Prop()
  redirectUrl: string;

  @Prop()
  description: string;

  @Prop()
  callbackUrl: string;

  @Prop()
  notificationId: string;

  @Prop()
  customerEmail: string;

  @Prop()
  customerPhone: string;

  @Prop()
  customerFirstName: string;

  @Prop()
  customerLastName: string;

  @Prop()
  accountNumber: string;
}

export const PaymentLinkSchema = SchemaFactory.createForClass(PaymentLink);
