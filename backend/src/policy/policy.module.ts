import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyVersion, PolicyVersionSchema } from './schemas/policy-version.schema';
import { PolicyService } from './policy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PolicyVersion.name, schema: PolicyVersionSchema },
    ]),
  ],
  providers: [PolicyService],
  exports: [PolicyService, MongooseModule],
})
export class PolicyModule {}
