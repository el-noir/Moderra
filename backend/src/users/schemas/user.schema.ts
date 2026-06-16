import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { USER_ROLE_VALUES, USER_ROLES, UserRole } from '../../common/constants/user.constants';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, required: true, enum: USER_ROLE_VALUES, default: USER_ROLES.USER })
  role: UserRole;

  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
