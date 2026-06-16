import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PolicyVersion,
  PolicyVersionDocument,
} from './schemas/policy-version.schema';

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(PolicyVersion.name)
    private readonly policyVersionModel: Model<PolicyVersionDocument>,
  ) {}

  findByVersion(version: number): Promise<PolicyVersionDocument | null> {
    return this.policyVersionModel.findOne({ version }).exec();
  }

  create(
    data: Pick<PolicyVersion, 'version' | 'isActive' | 'createdBy' | 'categories'>,
  ): Promise<PolicyVersionDocument> {
    return this.policyVersionModel.create(data);
  }
}
