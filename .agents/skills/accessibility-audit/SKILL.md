---
name: accessibility-audit
description: WCAG 2.1 AA accessibility audit scoped to shadcn-based components and pages.
  Knows shadcn's focus ring convention (ring-2 ring-ring ring-offset-2) and checks that
  custom components match it. Use before phase 8 or on demand.
---

# Accessibility Audit — shadcn Edition

Report as: CRITICAL (blocks WCAG 2.1 AA) / MODERATE (degrades experience) / LOW (best practice).

## shadcn-specific checks
- [ ] All shadcn interactive components (Button, Switch, Dialog trigger, Tab) retain their
      default focus ring — confirm no CSS resets it (outline-none without a replacement
      is a CRITICAL violation)
- [ ] Custom components (PolicyCategoryRow enforcement buttons, VerdictBadge interactive)
      use shadcn's focus convention: focus-visible:ring-2 focus-visible:ring-ring
      focus-visible:ring-offset-2 focus-visible:outline-none
- [ ] shadcn Dialog traps focus correctly — tab cannot leave the Dialog while it is open
- [ ] shadcn Sheet (mobile sidebar) traps focus correctly
- [ ] shadcn AlertDialog reads the alert text to screen readers on open (role="alertdialog")
- [ ] shadcn Sonner toasts are announced by screen readers (Sonner handles this natively
      via aria-live — confirm the Toaster is mounted in the root layout)

## Color contrast (verify in browser DevTools)
- [ ] text-foreground on bg-background: minimum 4.5:1
- [ ] text-muted-foreground on bg-card: minimum 3:1 (large text) or 4.5:1 (small)
- [ ] text-verdict-approved on bg-verdict-approved-bg: minimum 4.5:1
- [ ] text-verdict-flagged on bg-verdict-flagged-bg: minimum 4.5:1
- [ ] text-verdict-blocked on bg-verdict-blocked-bg: minimum 4.5:1
- [ ] font-mono text in ConfidenceBar labels (text-[10px]): if below 14px, needs 4.5:1+

## Labels and semantics
- [ ] Every shadcn Input has a visible Label (not just placeholder text)
- [ ] shadcn Switch components have aria-label when no adjacent visible label exists
- [ ] shadcn Tabs have accessible names (Tab content is described by TabsTrigger text)
- [ ] Image thumbnails have meaningful alt text, not empty or generic "image"
- [ ] shadcn Dialog has a DialogTitle (required — screen readers announce it on open)
- [ ] Icon-only Buttons have aria-label (logout, remove image, lightbox close)

## Screen reader text for custom components
- [ ] VerdictBadge: outer element has aria-label="Verdict: Approved" (not just visual dot + text)
- [ ] ConfidenceBar: div[role="progressbar"] has aria-valuenow, aria-valuemin, aria-valuemax,
      aria-label describing the score and threshold
- [ ] AppealStatusTimeline: renders as a semantic list or has role="list" for screen readers
- [ ] PolicyCategoryRow: disabled state communicated via aria-disabled, not just visual opacity

## Keyboard navigation
- [ ] Tab order matches visual reading order on every page
- [ ] shadcn Collapsible (expandable history rows, policy snapshot) operable via keyboard
- [ ] Admin queue keyboard shortcuts (A/R/J/K) do not conflict with screen reader shortcuts
      Consider: only activate when focus is NOT in an input or textarea

## Output
File:line, severity, description, recommended fix for each finding.
Total: X critical, Y moderate, Z low.
