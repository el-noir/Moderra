import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';
import { ImageVerdict, ImageVerdictSchema } from '../verdicts/schemas/image-verdict.schema';
import { Appeal, AppealSchema } from '../appeals/schemas/appeal.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: ImageVerdict.name, schema: ImageVerdictSchema },
      { name: Appeal.name, schema: AppealSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
