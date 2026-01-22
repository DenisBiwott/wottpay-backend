import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from 'src/domain/enums/user-role.enum';

@Schema({ timestamps: true }) // Adds createdAt and updatedAt automatically
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop()
  totpSecret?: string;

  @Prop({ default: false })
  isTotpEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
