---
name: responsive-audit
description: Verify the shadcn-based UI works at mobile (375px), tablet (768px), and
  desktop (1280px). Checks shadcn Sheet behavior on mobile, table-to-card conversion,
  and that no shadcn Dialog or Popover overflows the viewport.
---

# Responsive Audit — shadcn Edition

Test every page at three widths: 375px (mobile), 768px (tablet), 1280px (desktop).

## shadcn component responsive checks

### Sheet (mobile sidebar)
- [ ] At < 768px: the desktop sidebar is hidden (hidden md:flex or similar), the mobile
      trigger (hamburger or tab bar) is visible
- [ ] shadcn Sheet opens with a smooth slide-in from the left
- [ ] Sheet closes when navigating to a new route (add an onOpenChange handler that
      listens to pathname changes)
- [ ] Sheet does not leave a visible overlay artifact after closing

### Dialog and AlertDialog
- [ ] At 375px: Dialog is full-width (max-w-screen-sm with sm:max-w-lg, or similar)
      No Dialog should overflow or require horizontal scrolling to read
- [ ] AlertDialog confirm text is fully readable at 375px

### Popover (date pickers)
- [ ] Date range Popovers on /history filter bar do not overflow the viewport on mobile
      Consider: stack the two date inputs vertically at mobile, or use a full-width Popover

### Table → Card conversion
At 375px, shadcn Table components do not automatically convert to cards — this requires
custom implementation. Verify each Table page:
- [ ] /history: rows convert to stacked Cards (each row becomes a Card with the same data)
- [ ] /admin/verdicts: same treatment
- [ ] /admin/analytics category table: horizontal scroll with ScrollArea is acceptable here
      (data table with many columns — ScrollArea is the right shadcn solution)

## Layout checks at 375px
- [ ] /submit: dropzone and results panel stack vertically, no horizontal scroll
- [ ] CategoryRow: label and bar stack vertically (not the horizontal desktop layout)
- [ ] /admin/policy: single column, version history panel moves below the editor
- [ ] StatCards on /admin/analytics: 2-column grid at mobile (not 1 column, not 4)
- [ ] All buttons remain at least 44px tall (touch target minimum)

## Critical mobile path (walk through in browser at 375px)
1. Log in
2. Tap the submit tab (bottom nav)
3. Add an image and submit
4. View results — confirm CategoryRows stack correctly
5. Navigate to /history via bottom nav
6. Tap a row to expand it (Collapsible)
7. Navigate to /appeals via bottom nav

Report: ✅ Pass / ❌ Fail (component + file:line) / ⚠️ Minor issue.
Summary: X pages clean at all breakpoints, Y pages have issues.
