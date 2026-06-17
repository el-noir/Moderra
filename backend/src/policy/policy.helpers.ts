import { PolicyVersionDocument } from '../policy/schemas/policy-version.schema';
import { PolicySnapshot } from '../verdicts/compute-outcome';
import { ModerationCategoryName } from '../common/constants/moderation.constants';

export function buildPolicySnapshot(
  policy: PolicyVersionDocument,
): PolicySnapshot {
  return {
    categories: policy.categories.map((category) => ({
      name: category.name,
      enabled: category.enabled,
      confidenceThreshold: category.confidenceThreshold,
      enforcement: category.enforcement,
    })),
  };
}

export function getEnabledCategoryNames(
  policy: PolicyVersionDocument,
): ModerationCategoryName[] {
  return policy.categories
    .filter((category) => category.enabled)
    .map((category) => category.name);
}
