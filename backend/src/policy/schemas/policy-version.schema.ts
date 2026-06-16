import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PolicyCategory, PolicyCategorySchema } from './policy-category.schema';
import { User } from '../../users/schemas/user.schema';

export type PolicyVersionDocument = HydratedDocument<PolicyVersion>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class PolicyVersion {
  @Prop({ required: true, unique: true })
  version: number;

  @Prop({ required: true, default: false })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [PolicyCategorySchema], required: true })
  categories: PolicyCategory[];
}

export const PolicyVersionSchema = SchemaFactory.createForClass(PolicyVersion);

PolicyVersionSchema.index({ isActive: 1 });
