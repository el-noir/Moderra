# Database Schema and Core Business Logic Rules

## PolicyVersion — insert only
PolicyVersion documents are never updated in place. Every policy change inserts a new
version document and flips isActive to false on the previous one. There is no "edit
policy" code path in the data layer — only "create new policy version."
If you find yourself writing updateOne, findOneAndUpdate, or save() on an existing
PolicyVersion document, stop. That is a data-integrity bug.

## ImageVerdict — embed the snapshot
Every ImageVerdict embeds policySnapshot (a full copy of the active policy categories,
thresholds, and enforcement settings) at write time, in addition to policyVersionId.
The embedded copy, not a live lookup, determines that verdict's correctness forever.

## Outcome precedence
If both auto_block and flag_for_review trigger on the same image (from different
categories), the result is blocked. Auto-block always wins. Never compute outcome as
"last category wins" or "first category wins" — it must be precedence-based.

## Disabled categories
A category disabled in the active policy snapshot is excluded entirely — it must never
appear in categoryResults, and the moderation engine must never be called for it.

## AI failure handling
If the moderation engine errors or times out for an image, that image's outcome is
flagged (not approved, not a thrown exception), with categoryResults: [] and
processingError set to a short description.

## Appeals granularity
Appeals and overrides attach to ImageVerdict._id, never to Submission._id.
A Submission is only a batch container.

## Schema-level enforcement
- confidenceThreshold: Mongoose min: 0, max: 100
- outcome, classification, enforcement: Mongoose enum fields, not free strings
- Indexes: ImageVerdict on { userId: 1, createdAt: -1 } and { outcome: 1 }
- Indexes: Appeal on { imageVerdictId: 1, status: 1 }
- Indexes: PolicyVersion on { isActive: 1 }
- Partial unique index on Appeal: only one pending appeal per imageVerdictId
