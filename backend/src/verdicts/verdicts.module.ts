import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ImageVerdict,
  ImageVerdictSchema,
} from './schemas/image-verdict.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageVerdict.name, schema: ImageVerdictSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class VerdictsModule {}
