import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ImageVerdict,
  ImageVerdictSchema,
} from './schemas/image-verdict.schema';
import { VerdictsService } from './verdicts.service';
import { AdminVerdictsController } from './verdicts.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageVerdict.name, schema: ImageVerdictSchema },
    ]),
    UsersModule,
  ],
  controllers: [AdminVerdictsController],
  providers: [VerdictsService],
  exports: [MongooseModule, VerdictsService],
})
export class VerdictsModule {}
