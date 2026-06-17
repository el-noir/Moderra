import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SubmissionDocument = HydratedDocument<Submission>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ImageVerdict' }], default: [] })
  imageVerdictIds: Types.ObjectId[];

  createdAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

SubmissionSchema.index({ userId: 1, createdAt: -1 });
