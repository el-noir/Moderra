import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ENFORCEMENT_MODE_VALUES,
  EnforcementMode,
  MODERATION_CATEGORY_VALUES,
  ModerationCategoryName,
} from '../../common/constants/moderation.constants';

@Schema({ _id: false })
export class PolicyCategory {
  @Prop({ type: String, required: true, enum: MODERATION_CATEGORY_VALUES })
  name: ModerationCategoryName;

  @Prop({ required: true })
  enabled: boolean;

  @Prop({ required: true, min: 0, max: 100 })
  confidenceThreshold: number;

  @Prop({ type: String, required: true, enum: ENFORCEMENT_MODE_VALUES })
  enforcement: EnforcementMode;
}

export const PolicyCategorySchema = SchemaFactory.createForClass(PolicyCategory);
