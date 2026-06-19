---
name: component-polish
description: Audit a custom moderation component (in components/moderation/) for visual
  correctness, shadcn API usage, accessibility, edge cases, and animation. Use before
  a component goes into any production page.
---

# Component Polish — shadcn Edition

When invoked for a specific component name:

## shadcn API compliance
- [ ] Uses className prop for customization, never style overrides on shadcn internals
- [ ] Uses cn() utility from @/lib/utils for conditional class merging (not clsx or
      twMerge directly — shadcn projects use cn())
- [ ] Variant props are used where shadcn provides them (e.g. Button variant, Badge variant)
      rather than hardcoding the same classes inline
- [ ] No direct DOM manipulation or ref hacks to style shadcn component internals

## Visual correctness
- [ ] Uses only design token Tailwind classes — no hardcoded colors or raw hex
- [ ] All size variants render correctly (sm, md, lg or equivalent)
- [ ] Dark background (--background) renders correctly — run in the dark theme
- [ ] Long text does not break layout (test with a 60-character category name)
- [ ] The component renders without errors when optional props are undefined

## Accessibility
- [ ] Keyboard-focusable with a visible focus ring (ring-2 ring-ring ring-offset-2
      — shadcn's standard focus classes)
- [ ] Color is never the sole information carrier — text or icon always accompanies color
- [ ] ARIA role, label, or description on non-semantic interactive elements
- [ ] State changes announced to screen readers (aria-live or role="status" where needed)
- [ ] Disabled state is correctly communicated (aria-disabled + visual opacity)

## Animation
- [ ] Animated properties use only transform or opacity (GPU-accelerated)
      Exception: ConfidenceBar width animation is intentional — document it
- [ ] All animations use motion-safe: prefix so they skip on prefers-reduced-motion
- [ ] No flash or layout shift at animation start or end
- [ ] Animation class names match those defined in tailwind.config.ts keyframes

## Edge cases
- null / undefined props: component does not throw, renders a safe fallback
- Empty string: does not produce a broken-looking layout
- Rapid re-renders: no stale state or visual flash (check with React StrictMode)
- Very long strings: truncate with truncate class or wrap with break-words

## Output
For each item: ✅ pass, ❌ fail (file:line + description), N/A (reason).
Do not mark the component done until all ❌ items are fixed.
