---
description: Verify a completed phase against its acceptance criteria and the Definition
  of Done in PROJECT_PLAN.md section 10.
---

When the user types /verify <phase-number>:

1. Read the "Done when" condition for phase <phase-number> from CURSOR_PHASE_PROMPTS.md.

2. Run `npm test` in the backend workspace. Report pass or fail with the full output
   if any tests fail.

3. If the phase involves any user-facing flow, invoke the browser-verify skill and
   run the full sequence for both roles.

4. Run the api-contract-check skill if the phase added any new endpoints.

5. Check every item in PROJECT_PLAN.md section 10 (Definition of Done) that is in
   scope for this phase.

6. Report results:
   - Items passing: marked with checkmark
   - Items failing: marked with X plus file:line and description of the gap
   - Items not yet in scope: marked as skipped

The phase is considered done only when all in-scope items are passing.
