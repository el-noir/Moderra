import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  MODERATION_CATEGORY_VALUES,
  ModerationCategoryName,
} from '../../common/constants/moderation.constants';
import { CLASSIFICATION_VALUES, Classification } from '../../moderation/moderation.constants';

@Schema({ _id: false })
export class CategoryResult {
  @Prop({ type: String, required: true, enum: MODERATION_CATEGORY_VALUES })
  category: ModerationCategoryName;

  @Prop({ type: String, required: true, enum: CLASSIFICATION_VALUES })
  classification: Classification;

  @Prop({ required: true, min: 0, max: 100 })
  confidenceScore: number;

  @Prop({ required: true })
  reasoning: string;
}

export const CategoryResultSchema = SchemaFactory.createForClass(CategoryResult);
