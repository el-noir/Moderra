---
description: Full UI quality gate for a shadcn phase. Chains all four audit skills
  in sequence and produces a unified pass/fail report.
---

When the user types /ui-verify <phase-name>:

1. Invoke component-polish for every component in components/moderation/ that was
   created or modified in this phase. List the components being checked first.

2. Invoke ux-flow-verify for every user flow touched in this phase.
   Use the browser. Report step-by-step results.

3. Invoke accessibility-audit scoped to the pages modified in this phase.
   Report only CRITICAL and MODERATE findings.

4. Invoke responsive-audit scoped to the pages modified in this phase.
   Test at 375px and 1280px minimum.

5. Final report:
   Components:    X pass, Y need fixes
   UX flows:      X steps pass, Y fail
   Accessibility: X critical, Y moderate
   Responsive:    X pages clean, Y broken

The phase is visually done only when all of these are true:
- Zero component-polish failures
- Zero ux-flow-verify failures
- Zero accessibility CRITICAL findings
- Zero responsive failures on the critical mobile path (steps 1-7 in responsive-audit)
