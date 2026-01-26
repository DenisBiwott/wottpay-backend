import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentTransaction extends Document {
  createdAt: Date;
  updatedAt: Date;
  @Prop({ required: true, index: true })
  paymentLinkId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  businessId: string;

  @Prop({ required: true, index: true })
  orderTrackingId: string;

  @Prop({ required: true, index: true })
  merchantReference: string;

  @Prop()
  paymentMethod: string;

  @Prop()
  confirmationCode: string;

  @Prop({ required: true })
  statusCode: number;

  @Prop()
  statusMessage: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  paymentAccount: string;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);
