import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';
import { PolicyModule } from '../policy/policy.module';
import {
  ImageVerdict,
  ImageVerdictSchema,
} from '../verdicts/schemas/image-verdict.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [
    AuthModule,
    PolicyModule,
    ModerationModule,
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: ImageVerdict.name, schema: ImageVerdictSchema },
    ]),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
