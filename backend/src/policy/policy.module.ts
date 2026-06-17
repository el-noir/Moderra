import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PolicyVersion, PolicyVersionSchema } from './schemas/policy-version.schema';
import { AdminPolicyController, PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: PolicyVersion.name, schema: PolicyVersionSchema },
    ]),
  ],
  controllers: [PolicyController, AdminPolicyController],
  providers: [PolicyService],
  exports: [PolicyService, MongooseModule],
})
export class PolicyModule {}
