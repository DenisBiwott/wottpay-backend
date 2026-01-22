import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // Adds createdAt and updatedAt automatically
export class Business extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  pesapalConsumerKey: string;

  @Prop({ required: true })
  pesapalConsumerSecret: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
