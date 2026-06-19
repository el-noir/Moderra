---
description: Start a new build phase. Anchors the agent to PROJECT_PLAN.md and the
  relevant existing files before any code is written.
---

When the user types /startphase <phase-number> <phase-name>:

1. Read PROJECT_PLAN.md in full. Confirm you have read it by summarizing all six rules
   from section 3 (Non-Negotiable Design Decisions) back to the developer in your own
   words — do not paraphrase or abbreviate any of them.

2. Read CURSOR_PHASE_PROMPTS.md and find the phase matching <phase-number>. State the
   exact "Done when" condition for that phase.

3. List every existing file in the relevant source directory (backend/src/<module> or
   frontend/app/<route>) and describe what is already there in 2-3 sentences.

4. Ask: "Ready to start? Should I use the plan-before-code skill first, or proceed
   directly to schema-first?"

5. Wait for the developer's response before writing any code.
