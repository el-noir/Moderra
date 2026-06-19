import { BadRequestException } from '@nestjs/common';
import { Schema } from 'mongoose';

const IMMUTABLE_POLICY_FIELDS = ['categories', 'version', 'createdBy'] as const;

function getUpdatePayload(update: unknown): Record<string, unknown> {
  if (!update || typeof update !== 'object') {
    return {};
  }

  const record = update as Record<string, unknown>;
  const setPayload =
    record.$set && typeof record.$set === 'object'
      ? (record.$set as Record<string, unknown>)
      : {};

  return { ...record, ...setPayload };
}

function assertImmutableFieldsNotUpdated(update: unknown): void {
  const payload = getUpdatePayload(update);

  for (const field of IMMUTABLE_POLICY_FIELDS) {
    if (field in payload) {
      throw new BadRequestException(
        'PolicyVersion documents are immutable. Insert a new version instead of updating existing fields.',
      );
    }
  }
}

export function applyPolicyVersionImmutabilityGuards(schema: Schema): void {
  schema.pre('save', function policyVersionSaveGuard(this: any) {
    if (!this.isNew && this.isModified('categories')) {
      throw new BadRequestException(
        'PolicyVersion categories cannot be modified in place. Insert a new version instead.',
      );
    }

    if (!this.isNew && this.isModified('version')) {
      throw new BadRequestException(
        'PolicyVersion number cannot be modified in place. Insert a new version instead.',
      );
    }

    if (!this.isNew && this.isModified('createdBy')) {
      throw new BadRequestException(
        'PolicyVersion createdBy cannot be modified in place. Insert a new version instead.',
      );
    }
  });

  const queryGuard = function policyVersionQueryGuard(this: {
    getUpdate: () => unknown;
  }) {
    assertImmutableFieldsNotUpdated(this.getUpdate());
  };

  schema.pre('updateOne', queryGuard as never);
  schema.pre('updateMany', queryGuard as never);
  schema.pre('findOneAndUpdate', queryGuard as never);
  schema.pre('replaceOne', function policyVersionReplaceGuard() {
    throw new BadRequestException(
      'PolicyVersion documents cannot be replaced. Insert a new version instead.',
    );
  });
}
