---
description: Start a UI polish phase with a shadcn project. Runs design-system audit
  first, confirms all required shadcn components are installed, then proceeds.
---

When the user types /ui-phase <phase-name>:

1. Read UI_POLISH_PLAN.md in full.

2. Invoke the design-system skill to audit the current codebase.
   Report any existing token violations or shadcn misuse before new code is written.

3. Check that every shadcn component in the install list (UI_POLISH_PLAN.md section 1)
   is present in components/ui/. List any that are missing and install them with
   `npx shadcn@latest add <component>` before proceeding.

4. State which pages and components will be created or modified in this phase.

5. Ask: "Ready to proceed, or should I fix existing violations first?"
   Wait for confirmation.
