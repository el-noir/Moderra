---
name: design-system
description: Audit and enforce the shadcn-based token system. Use when reviewing color
  usage, adding new components, or verifying no hardcoded values exist outside globals.css.
  Knows the difference between shadcn-owned tokens and product-specific verdict tokens.
---

# Design System Enforcement — shadcn Edition

## What this skill knows
- shadcn's token system lives in app/globals.css under :root and .dark
- Product tokens (verdict colors) are extensions INSIDE the .dark block
- components/ui/ is owned by shadcn — never audit it for custom violations
- All custom components live in components/moderation/ and components/layout/

## Hardcoded value audit
Scan all .tsx files in components/moderation/, components/layout/, and app/ and report:

1. Raw hex colors (#XXXXXX) anywhere outside globals.css and tailwind.config.ts
2. Tailwind color utilities that bypass the token system:
   - bg-green-*, text-green-* (should be verdict-approved or text-verdict-approved)
   - bg-red-*, text-red-* (should be verdict-blocked variants)
   - bg-yellow-*, bg-amber-* (should be verdict-flagged variants)
   - bg-gray-*, bg-zinc-*, bg-slate-* (should be bg-muted, bg-card, bg-background)
3. Hardcoded font-family strings (should use font-sans or font-mono classes)
4. Hardcoded border-radius values not using shadcn's rounded-* scale

## shadcn component misuse
Report any case where:
- A custom component was built from scratch when a shadcn primitive exists
  (e.g. a custom modal instead of Dialog, a custom toggle instead of Switch)
- A shadcn component's internal CSS was overridden with arbitrary CSS
  (only className prop and CSS variables are acceptable override methods)
- components/ui/ contains any file not installed by `npx shadcn@latest add`

## Verdict color consistency check
The classes verdict-approved, verdict-flagged, verdict-blocked and their -bg and -border
variants must appear consistently across: VerdictBadge, ConfidenceBar, CategoryRow,
and any status-indicating UI element. Find any element showing verdict state that uses
a different color (e.g. text-green-500 instead of text-verdict-approved).

## Output
For each violation: file:line, what was found, what it should be.
If zero violations: "Design system audit passed — N files checked."
