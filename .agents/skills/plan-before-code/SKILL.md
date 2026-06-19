---
name: plan-before-code
description: Before implementing any feature, interview the developer about requirements,
  constraints, and acceptance criteria. Use for any new module, endpoint, or non-trivial
  change to the verdict, policy, or appeal logic.
---

# Plan Before Code

Before writing any implementation code:

1. Read all files relevant to this task. Summarize what you found in 3-5 sentences.
2. State your interpretation of what needs to be built and what "done" looks like.
3. Ask the developer:
   - Are there existing files or schemas this must not break?
   - Are there constraints not visible in the codebase (specifically section 3 of PROJECT_PLAN.md)?
   - What specific behavior should be verifiable after this is complete?
4. Write your step-by-step implementation plan and show it before touching any file.
5. Ask: "Does this match your intent? Anything to adjust before I start?"
6. Proceed only after explicit developer approval.

The most common implementation error on this project is quietly simplifying a policy
versioning or verdict granularity decision because the simpler shape is more familiar.
Surface that temptation in step 4, not after six files have been written.
