---
name: schema-first
description: When creating or modifying a Mongoose schema or domain entity, produce and
  get approval on TypeScript interfaces and schema definitions before any service,
  controller, or DTO code is written.
---

# Schema-First Development

When a task involves any domain entity:

1. Write the TypeScript interface (domain shape) for the entity.
2. Write the Mongoose schema definition alongside it.
3. Show both with this checklist before continuing:
   - [ ] Enum fields use Mongoose enum validation, not free strings
   - [ ] Numeric thresholds have min/max Mongoose validators (0-100)
   - [ ] Required indexes are declared (see PROJECT_PLAN.md section 4)
   - [ ] PolicyVersion: no findOneAndUpdate, updateOne, or save() path exists anywhere
   - [ ] ImageVerdict: policySnapshot embedded as subdocument, not a DBRef
   - [ ] Appeal: partial unique index on { imageVerdictId: 1, status: 'pending' }
4. Wait for explicit developer approval.
5. Only then write service, controller, test, and DTO code.

Do not skip this skill for tasks touching PolicyVersion, ImageVerdict, Appeal, or
anything that embeds or references these collections.
