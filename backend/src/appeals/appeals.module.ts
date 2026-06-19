import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  ImageVerdict,
  ImageVerdictSchema,
} from '../verdicts/schemas/image-verdict.schema';
import { AdminAppealsController, AppealsController } from './appeals.controller';
import { AppealsService } from './appeals.service';
import { Appeal, AppealSchema } from './schemas/appeal.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Appeal.name, schema: AppealSchema },
      { name: ImageVerdict.name, schema: ImageVerdictSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AppealsController, AdminAppealsController],
  providers: [AppealsService],
})
export class AppealsModule {}
