import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { VERDICT_OUTCOME_VALUES, VerdictOutcome } from '../../common/constants/verdict.constants';
import { PolicyCategory, PolicyCategorySchema } from '../../policy/schemas/policy-category.schema';
import { PolicyVersion } from '../../policy/schemas/policy-version.schema';
import { User } from '../../users/schemas/user.schema';
import { CategoryResult, CategoryResultSchema } from './category-result.schema';

export type ImageVerdictDocument = HydratedDocument<ImageVerdict>;

@Schema({ _id: false })
export class PolicySnapshotEmbed {
  @Prop({ type: [PolicyCategorySchema], required: true })
  categories: PolicyCategory[];
}

export const PolicySnapshotEmbedSchema =
  SchemaFactory.createForClass(PolicySnapshotEmbed);

@Schema({ _id: false })
export class VerdictOverride {
  @Prop({ required: true })
  isOverridden: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  by: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  at: Date;
}

export const VerdictOverrideSchema = SchemaFactory.createForClass(VerdictOverride);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ImageVerdict {
  @Prop({ type: Types.ObjectId, ref: 'Submission', required: true, index: true })
  submissionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  imagePath: string;

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ type: String, required: true, enum: VERDICT_OUTCOME_VALUES })
  outcome: VerdictOutcome;

  @Prop({ type: [CategoryResultSchema], required: true, default: [] })
  categoryResults: CategoryResult[];

  @Prop({ type: Types.ObjectId, ref: PolicyVersion.name, required: true })
  policyVersionId: Types.ObjectId;

  @Prop({ type: PolicySnapshotEmbedSchema, required: true })
  policySnapshot: PolicySnapshotEmbed;

  @Prop({ type: String, default: null })
  processingError: string | null;

  @Prop({ type: VerdictOverrideSchema, default: null })
  override: VerdictOverride | null;

  @Prop({ type: Types.ObjectId, ref: 'Appeal', default: null })
  appealId: Types.ObjectId | null;

  createdAt: Date;
}

export const ImageVerdictSchema = SchemaFactory.createForClass(ImageVerdict);

ImageVerdictSchema.index({ userId: 1, createdAt: -1 });
ImageVerdictSchema.index({ outcome: 1 });
