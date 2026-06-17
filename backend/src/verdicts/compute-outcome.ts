import {
  ENFORCEMENT_MODES,
  ModerationCategoryName,
} from '../common/constants/moderation.constants';
import {
  VERDICT_OUTCOMES,
  VerdictOutcome,
} from '../common/constants/verdict.constants';
import { Classification } from '../moderation/moderation.constants';

/** Embedded on ImageVerdict at write time — immutable policy config used for scoring. */
export interface PolicySnapshotCategory {
  name: ModerationCategoryName;
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: (typeof ENFORCEMENT_MODES)[keyof typeof ENFORCEMENT_MODES];
}

export interface PolicySnapshot {
  categories: PolicySnapshotCategory[];
}

/** Per-category AI result stored on ImageVerdict.categoryResults. */
export interface CategoryResultInput {
  category: ModerationCategoryName;
  classification: Classification;
  confidenceScore: number;
  reasoning: string;
}

/**
 * Computes the final image verdict outcome from category results and the policy snapshot
 * that was active at evaluation time.
 *
 * Precedence (PROJECT_PLAN.md §3.5 — not order-based):
 * - If any triggered category has auto_block enforcement → blocked
 * - Else if any triggered category has flag_for_review enforcement → flagged
 * - Else → approved
 *
 * A category is "triggered" when its confidenceScore >= the snapshot threshold for that category.
 * Only categories present in categoryResults should be evaluated (disabled categories are excluded
 * upstream per §3.4 and must not appear here).
 *
 * AI failure handling (§3.6) is handled before this function is called: pass categoryResults = []
 * only when processingError is set; the caller sets outcome = flagged directly in that case.
 */
export function computeOutcome(
  categoryResults: CategoryResultInput[],
  policySnapshot: PolicySnapshot,
): VerdictOutcome {
  let autoBlockTriggered = false;
  let flagTriggered = false;

  for (const result of categoryResults) {
    const policy = policySnapshot.categories.find(
      (category) => category.name === result.category,
    );

    if (!policy) {
      throw new Error(
        `Policy snapshot missing category "${result.category}" referenced in categoryResults`,
      );
    }

    if (!policy.enabled) {
      throw new Error(
        `Policy snapshot category "${result.category}" is disabled but appeared in categoryResults`,
      );
    }

    if (result.confidenceScore >= policy.confidenceThreshold) {
      if (policy.enforcement === ENFORCEMENT_MODES.AUTO_BLOCK) {
        autoBlockTriggered = true;
      } else {
        flagTriggered = true;
      }
    }
  }

  if (autoBlockTriggered) {
    return VERDICT_OUTCOMES.BLOCKED;
  }

  if (flagTriggered) {
    return VERDICT_OUTCOMES.FLAGGED;
  }

  return VERDICT_OUTCOMES.APPROVED;
}
