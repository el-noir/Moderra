import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  APPEAL_STATUSES,
  APPEAL_STATUS_VALUES,
  AppealStatus,
} from '../../common/constants/appeal.constants';
import { User } from '../../users/schemas/user.schema';

export type AppealDocument = HydratedDocument<Appeal>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Appeal {
  @Prop({ type: Types.ObjectId, ref: 'ImageVerdict', required: true })
  imageVerdictId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  justification: string;

  @Prop({
    type: String,
    required: true,
    enum: APPEAL_STATUS_VALUES,
    default: APPEAL_STATUSES.PENDING,
  })
  status: AppealStatus;

  @Prop({ type: String, default: null })
  adminResponse: string | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  createdAt: Date;
}

export const AppealSchema = SchemaFactory.createForClass(Appeal);

AppealSchema.index({ imageVerdictId: 1, status: 1 });
AppealSchema.index(
  { imageVerdictId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: APPEAL_STATUSES.PENDING },
  },
);
