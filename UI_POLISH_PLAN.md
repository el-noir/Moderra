# UI Polish Plan — Next.js + shadcn/ui
# AI Content Moderation Platform

---

## 0. The Rule With shadcn

shadcn already owns your token system (CSS variables in globals.css), your component
primitives, and your Tailwind config. The job here is to:

1. **Extend** shadcn's CSS variables — don't add a parallel system
2. **Build custom components on top of** shadcn primitives — not from scratch
3. **Theme** shadcn's dark mode to match the product's visual direction
4. **Never** override a shadcn component's internals with raw CSS — use its variant/className API

If you find yourself fighting shadcn to get a design effect, the design is wrong,
not shadcn.

---

## 1. shadcn Components to Install

Run these before touching any UI. Install only what's on this list — not the entire
catalog. Every component here has a specific job in this product.

```bash
npx shadcn@latest init        # if not already done — pick Dark theme, CSS variables: yes

npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add tabs
npx shadcn@latest add switch
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add table
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add sonner
npx shadcn@latest add tooltip
npx shadcn@latest add alert
npx shadcn@latest add progress
npx shadcn@latest add collapsible
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add sheet
npx shadcn@latest add scroll-area
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
npx shadcn@latest add popover
npx shadcn@latest add calendar
npx shadcn@latest add radio-group
npx shadcn@latest add alert-dialog
```

Chart library — Recharts is already what shadcn recommends:
```bash
npm install recharts
npx shadcn@latest add chart
```

---

## 2. Theme — Extending globals.css

shadcn's CSS variables live in `app/globals.css` under `:root` (light) and
`.dark` (dark). **Add your product-specific tokens inside the existing `.dark` block.**
Do not create a separate file or a parallel token namespace.

```css
/* Add inside the existing .dark {} block in globals.css */
.dark {
  /* shadcn's existing vars stay — add BELOW them */

  /* === Product-specific verdict tokens === */
  --verdict-approved:         142 71% 45%;     /* HSL — matches shadcn convention */
  --verdict-approved-bg:      142 71% 5%;
  --verdict-approved-border:  142 71% 15%;

  --verdict-flagged:          45 93% 47%;
  --verdict-flagged-bg:       45 93% 5%;
  --verdict-flagged-border:   45 93% 15%;

  --verdict-blocked:          0 84% 60%;
  --verdict-blocked-bg:       0 84% 5%;
  --verdict-blocked-border:   0 84% 15%;

  /* === Surface overrides (darken shadcn's defaults) === */
  --background:               224 20% 4%;      /* #0A0B0F — darker than shadcn default */
  --card:                     224 18% 7%;      /* #111318 — raised surfaces */
  --muted:                    224 15% 11%;     /* #1A1D26 — overlay surfaces */
  --border:                   225 14% 20%;     /* #2A2D3E */
  --input:                    225 14% 20%;

  /* === Brand accent === */
  --primary:                  234 87% 62%;     /* #5B6EF5 — indigo */
  --primary-foreground:       0 0% 100%;
  --ring:                     234 87% 62%;     /* focus rings match primary */

  /* === Typography === */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

Then extend `tailwind.config.ts` to expose the verdict tokens as utilities:

```ts
// tailwind.config.ts — add inside theme.extend
extend: {
  colors: {
    verdict: {
      approved:        'hsl(var(--verdict-approved))',
      'approved-bg':   'hsl(var(--verdict-approved-bg))',
      'approved-border':'hsl(var(--verdict-approved-border))',
      flagged:         'hsl(var(--verdict-flagged))',
      'flagged-bg':    'hsl(var(--verdict-flagged-bg))',
      'flagged-border':'hsl(var(--verdict-flagged-border))',
      blocked:         'hsl(var(--verdict-blocked))',
      'blocked-bg':    'hsl(var(--verdict-blocked-bg))',
      'blocked-border':'hsl(var(--verdict-blocked-border))',
    },
  },
  fontFamily: {
    sans:  ['Inter', 'system-ui', 'sans-serif'],
    mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  keyframes: {
    'confidence-fill': {
      '0%':   { width: '0%' },
      '100%': { width: 'var(--target-width)' },
    },
    shimmer: {
      '0%':   { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    'verdict-pulse': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%':      { transform: 'scale(1.05)' },
    },
  },
  animation: {
    'confidence-fill': 'confidence-fill 600ms ease-out forwards',
    shimmer:           'shimmer 1.5s linear infinite',
    'verdict-pulse':   'verdict-pulse 300ms ease-in-out',
  },
},
```

Add Inter + JetBrains Mono to `app/layout.tsx`:

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

// On <html>: className={`${inter.variable} ${mono.variable} dark`}
// Force dark mode always — this is not a light/dark toggle app
```

---

## 3. Custom Components (Built on shadcn Primitives)

All live in `components/moderation/`. These are NOT in `components/ui/` —
that folder is owned by shadcn. Never put custom components there.

### VerdictBadge

Built on shadcn `Badge`. Uses `variant` extension — no new component from scratch.

```tsx
// components/moderation/verdict-badge.tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { VerdictOutcome } from '@/lib/constants'

const config: Record<VerdictOutcome | 'pending', {
  dot: string; label: string; classes: string
}> = {
  approved: {
    dot:    'bg-verdict-approved',
    label:  'APPROVED',
    classes:'bg-verdict-approved-bg border-verdict-approved-border text-verdict-approved',
  },
  flagged: {
    dot:    'bg-verdict-flagged',
    label:  'FLAGGED',
    classes:'bg-verdict-flagged-bg border-verdict-flagged-border text-verdict-flagged',
  },
  blocked: {
    dot:    'bg-verdict-blocked',
    label:  'BLOCKED',
    classes:'bg-verdict-blocked-bg border-verdict-blocked-border text-verdict-blocked',
  },
  pending: {
    dot:    'bg-primary',
    label:  'PENDING',
    classes:'bg-primary/10 border-primary/30 text-primary',
  },
}

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
}

const dotSizes = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2', lg: 'h-2.5 w-2.5' }

type Props = {
  outcome: VerdictOutcome | 'pending'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function VerdictBadge({ outcome, size = 'md', className }: Props) {
  const { dot, label, classes } = config[outcome]
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono font-semibold tracking-wider border transition-colors duration-300',
        classes, sizes[size], className
      )}
    >
      <span className={cn('rounded-full shrink-0', dot, dotSizes[size])} aria-hidden />
      <span>{label}</span>
    </Badge>
  )
}
```

### ConfidenceBar

Built on shadcn `Progress` + `Tooltip`.

```tsx
// components/moderation/confidence-bar.tsx
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type Props = {
  score: number           // 0-100
  threshold: number       // from policy snapshot
  enforcement: 'auto_block' | 'flag_for_review'
  animated?: boolean
}

export function ConfidenceBar({ score, threshold, enforcement, animated = true }: Props) {
  const triggered    = score >= threshold
  const fillColor    = !triggered
    ? 'bg-muted-foreground/30'
    : enforcement === 'auto_block'
      ? 'bg-verdict-blocked'
      : 'bg-verdict-flagged'

  const thresholdPct = `${threshold}%`
  const tooltipText  = `Score: ${score} / Threshold: ${threshold} — ${
    triggered
      ? `triggered (${enforcement === 'auto_block' ? 'auto block' : 'flag for review'})`
      : 'below threshold'
  }`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative w-full group">
          {/* Track */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            {/* Fill */}
            <div
              className={cn(
                'h-full rounded-full',
                fillColor,
                animated && 'motion-safe:animate-confidence-fill'
              )}
              style={{
                width: animated ? undefined : `${score}%`,
                '--target-width': `${score}%`,
              } as React.CSSProperties}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={tooltipText}
            />
          </div>

          {/* Threshold tick */}
          <div
            className="absolute top-0 h-1.5 w-0.5 bg-foreground/40 rounded-full"
            style={{ left: thresholdPct }}
            aria-hidden
          />

          {/* Threshold label */}
          <span
            className="absolute -top-4 font-mono text-[10px] text-muted-foreground
                       -translate-x-1/2 select-none"
            style={{ left: thresholdPct }}
            aria-hidden
          >
            {threshold}
          </span>

          {/* Score label */}
          <span className={cn(
            'absolute right-0 -top-4 font-mono text-[10px]',
            triggered ? (enforcement === 'auto_block'
              ? 'text-verdict-blocked' : 'text-verdict-flagged')
              : 'text-muted-foreground'
          )}>
            {score}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-mono text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

### CategoryRow

Built with shadcn `Badge` + `Tooltip`. No new primitive needed.

```tsx
// components/moderation/category-row.tsx
import { cn } from '@/lib/utils'
import { ConfidenceBar } from './confidence-bar'
import { Badge } from '@/components/ui/badge'

type Props = {
  category:        string
  classification:  'detected' | 'not_detected'
  confidenceScore: number
  reasoning:       string
  threshold:       number
  enforcement:     'auto_block' | 'flag_for_review'
}

export function CategoryRow({
  category, classification, confidenceScore, reasoning, threshold, enforcement
}: Props) {
  const triggered = confidenceScore >= threshold && classification === 'detected'

  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 rounded-md transition-colors',
      'hover:bg-muted/50',
      triggered && enforcement === 'auto_block'  && 'bg-verdict-blocked-bg/60',
      triggered && enforcement === 'flag_for_review' && 'bg-verdict-flagged-bg/60',
    )}>
      {/* Category name */}
      <span className="w-44 shrink-0 text-sm font-medium text-foreground truncate">
        {category}
      </span>

      {/* Classification chip */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 font-mono text-[10px] w-24 justify-center',
          classification === 'detected'
            ? 'border-verdict-blocked/40 text-verdict-blocked bg-verdict-blocked-bg/40'
            : 'border-muted text-muted-foreground'
        )}
      >
        {classification === 'detected' ? 'DETECTED' : 'CLEAR'}
      </Badge>

      {/* Confidence bar */}
      <div className="flex-1 pt-4 pb-1">
        <ConfidenceBar
          score={confidenceScore}
          threshold={threshold}
          enforcement={enforcement}
        />
      </div>

      {/* Enforcement tag */}
      <span className={cn(
        'shrink-0 font-mono text-[10px] text-muted-foreground w-20 text-right',
        triggered && enforcement === 'auto_block' && 'text-verdict-blocked',
        triggered && enforcement === 'flag_for_review' && 'text-verdict-flagged',
      )}>
        {enforcement === 'auto_block' ? 'AUTO BLOCK' : 'REVIEW'}
      </span>
    </div>
  )
}
```

### PolicyCategoryRow

Built on shadcn `Switch` + `Input` + custom segmented control.

```tsx
// components/moderation/policy-category-row.tsx
import { Switch }    from '@/components/ui/switch'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { cn }        from '@/lib/utils'

type PolicyCategory = {
  name:                string
  enabled:             boolean
  confidenceThreshold: number
  enforcement:         'auto_block' | 'flag_for_review'
}

type Props = {
  category: PolicyCategory
  modified: boolean
  onChange: (updated: PolicyCategory) => void
}

export function PolicyCategoryRow({ category, modified, onChange }: Props) {
  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 rounded-md border transition-all',
      'border-border bg-card',
      !category.enabled && 'opacity-50',
      modified && 'border-l-2 border-l-primary',
    )}>
      {/* Toggle */}
      <Switch
        checked={category.enabled}
        onCheckedChange={v => onChange({ ...category, enabled: v })}
        aria-label={`Enable ${category.name}`}
      />

      {/* Name */}
      <Label className="w-44 shrink-0 font-medium text-sm cursor-default">
        {category.name}
      </Label>

      {/* Threshold input */}
      <div className="flex items-center gap-2 shrink-0">
        <Label className="text-xs text-muted-foreground">Threshold</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={category.confidenceThreshold}
          disabled={!category.enabled}
          onChange={e => onChange({
            ...category,
            confidenceThreshold: Number(e.target.value)
          })}
          className="w-16 font-mono text-sm text-center h-8"
        />
      </div>

      {/* Enforcement — segmented control built from two styled buttons */}
      <div className={cn(
        'flex rounded-md border border-border overflow-hidden shrink-0',
        !category.enabled && 'pointer-events-none'
      )}>
        {(['flag_for_review', 'auto_block'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onChange({ ...category, enforcement: mode })}
            className={cn(
              'px-3 py-1 text-xs font-mono transition-colors',
              category.enforcement === mode
                ? mode === 'auto_block'
                  ? 'bg-verdict-blocked-bg text-verdict-blocked border-l-2 border-l-verdict-blocked'
                  : 'bg-verdict-flagged-bg text-verdict-flagged border-l-2 border-l-verdict-flagged'
                : 'bg-transparent text-muted-foreground hover:bg-muted',
            )}
          >
            {mode === 'auto_block' ? 'Auto Block' : 'Flag for Review'}
          </button>
        ))}
      </div>

      {/* Modified indicator */}
      {modified && (
        <span className="ml-auto text-[10px] font-mono text-primary">modified</span>
      )}
    </div>
  )
}
```

### AppealStatusTimeline

Pure composition — no shadcn primitive needed, uses design tokens only.

```tsx
// components/moderation/appeal-timeline.tsx
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

type Props = {
  createdAt:     string
  status:        'pending' | 'accepted' | 'rejected'
  reviewedAt?:   string
  adminResponse?:string
}

const steps = ['Filed', 'Under Review', 'Resolved'] as const

export function AppealStatusTimeline({ createdAt, status, reviewedAt, adminResponse }: Props) {
  const activeStep = status === 'pending' ? 1 : 2

  return (
    <div className="flex flex-col gap-0">
      {steps.map((label, i) => {
        const done   = i < activeStep
        const active = i === activeStep
        const future = i > activeStep

        return (
          <div key={label} className="flex gap-3">
            {/* Node + connector */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'h-4 w-4 rounded-full border-2 shrink-0 transition-colors',
                done   && 'bg-primary border-primary',
                active && 'bg-background border-primary',
                future && 'bg-background border-border',
                i === 2 && status === 'accepted' && 'border-verdict-approved bg-verdict-approved',
                i === 2 && status === 'rejected' && 'border-verdict-blocked bg-verdict-blocked',
              )} />
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-0.5 flex-1 min-h-4',
                  done ? 'bg-primary' : 'bg-border border-dashed'
                )} />
              )}
            </div>

            {/* Label + timestamp */}
            <div className="pb-4 pt-0.5">
              <p className={cn(
                'text-sm font-medium',
                future ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {label}
              </p>
              {i === 0 && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
              )}
              {i === 2 && reviewedAt && (
                <>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {formatDistanceToNow(new Date(reviewedAt), { addSuffix: true })}
                  </p>
                  {adminResponse && (
                    <blockquote className="mt-2 border-l-2 border-border pl-3
                                          text-xs text-muted-foreground italic">
                      {adminResponse}
                    </blockquote>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

---

## 4. Layout Shell

Built on shadcn `Sheet` (mobile drawer) + `Separator` + `Avatar`.

```
frontend/components/layout/
  app-shell.tsx         ← wraps every protected page
  sidebar.tsx           ← desktop fixed sidebar
  mobile-nav.tsx        ← bottom tab bar + Sheet drawer for mobile
  top-bar.tsx           ← page title + primary action slot
```

Sidebar nav uses Next.js `usePathname()` to determine the active route.
Active item: `bg-primary/10 text-primary border-l-2 border-l-primary` (shadcn-native classes).
The Administration section renders only when `session.user.role === 'admin'`.

---

## 5. Page Skeletons

Every page that fetches data uses a `<PageSkeleton />` specific to its layout.
Built from shadcn `Skeleton` component. Never use a spinner where a skeleton fits.

```tsx
// Example — HistorySkeleton
import { Skeleton } from '@/components/ui/skeleton'

export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-lg border border-border">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
```

---

## 6. Toast / Notification Strategy

Use shadcn `Sonner` (not the older `Toast` component — Sonner is the current recommendation).

```tsx
// app/layout.tsx
import { Toaster } from '@/components/ui/sonner'
// Add <Toaster theme="dark" position="bottom-right" /> to the layout

// Usage everywhere else:
import { toast } from 'sonner'

toast.success('Appeal submitted')
toast.error('Submission failed — please try again')
toast.info('Policy saved as version 9')
```

Toasts replace inline success/error states on form submissions.
Inline error states (red border + message) remain on field-level validation.

---

## 7. Motion Rules (Tailwind + CSS Only)

No Framer Motion — keep the bundle lean. Everything here uses Tailwind animation
utilities and CSS transitions.

```
Page transitions:    Handled by Next.js App Router's built-in view transitions API.
                     Add <link rel="stylesheet" .../> for ViewTransitions polyfill
                     if needed. Zero JS.

ConfidenceBar fill:  animate-confidence-fill (defined in tailwind.config.ts above)
                     Wraps in motion-safe: so it's skipped if prefers-reduced-motion.

CategoryRow stagger: Use CSS animation-delay with inline style on each row:
                     style={{ animationDelay: `${index * 40}ms` }}

Verdict badge change: transition-colors duration-300 — already in the VerdictBadge
                      className. shadcn's Badge takes transition classes cleanly.

Skeleton shimmer:    animate-shimmer on a gradient background-image.
                     Already handled by shadcn Skeleton's default animation.

Policy version pulse: animate-verdict-pulse on the version badge element,
                      triggered by adding/removing the class after a save.
```

---

## 8. Antigravity Prompts

### UP-1 — Theme and Token Setup

```
@engineer

Set up the shadcn theme for the moderation platform. Do not create any new components yet.

1. Install Inter and JetBrains Mono from next/font/google. Set them up in app/layout.tsx
   with CSS variables --font-sans and --font-mono. Force the dark class on the <html>
   element — this app has no light mode.

2. In app/globals.css, inside the existing .dark {} block (DO NOT replace shadcn's
   existing variables), add the product-specific tokens from UI_POLISH_PLAN.md section 2:
   - Three verdict color sets (approved, flagged, blocked) each with a main, -bg, and
     -border variant using HSL format matching shadcn's convention
   - Override --background, --card, --muted, --border to the darker values in the plan
   - Override --primary and --ring to the indigo brand color

3. Extend tailwind.config.ts with:
   - verdict color utilities (verdict-approved, verdict-approved-bg, etc.)
   - fontFamily.sans and fontFamily.mono referencing the CSS variables
   - The three keyframes and animations from the plan: confidence-fill, shimmer,
     verdict-pulse

4. Run `npx shadcn@latest add` for EVERY component in the install list from
   UI_POLISH_PLAN.md section 1. Show me the list before running — I want to confirm
   nothing is missing.

Done when: I can use bg-verdict-approved-bg and text-verdict-blocked as Tailwind classes
on any element and they render the correct colors in the dark theme.
Show me a quick test: a div with each verdict color class side by side.
```

### UP-2 — Core Moderation Components

```
@engineer

Build the five custom moderation components from UI_POLISH_PLAN.md section 3.
All go in components/moderation/. DO NOT put them in components/ui/ — that folder
is owned by shadcn and must not be modified.

Build them in this exact order. Show me each one before moving to the next.

1. VerdictBadge — wraps shadcn Badge. Props: outcome, size (sm/md/lg).
   Three sizes, dot + label, transition-colors for animated state changes.

2. ConfidenceBar — wraps shadcn Progress + Tooltip. Props: score, threshold, enforcement.
   Threshold tick marker with label. Fill color depends on triggered state and enforcement.
   Use animate-confidence-fill with motion-safe: prefix.

3. CategoryRow — uses ConfidenceBar + shadcn Badge. Props: full category result + policy config.
   Horizontal layout on desktop. Triggered rows get faint verdict-color tinted background.

4. AppealStatusTimeline — pure composition, no new shadcn primitive. Props: createdAt,
   status, reviewedAt, adminResponse. Three-node vertical timeline.

5. PolicyCategoryRow — uses shadcn Switch, Input, Label. Custom segmented control for
   enforcement (two styled buttons, NOT a Select or RadioGroup — the visual separation
   of the two options at a glance is important for this control).

After all five are built, create app/(dev)/components/page.tsx that renders every
component with every variant state. This page is only visible in development.
Do not show it in the sidebar nav.
```

### UP-3 — App Shell

```
@engineer

Build the authenticated app shell using shadcn Sheet for the mobile drawer.
Files to create: components/layout/app-shell.tsx, sidebar.tsx, mobile-nav.tsx, top-bar.tsx.

Sidebar (desktop, 240px fixed):
- Use shadcn Separator between nav sections
- Use Next.js usePathname() for active route detection
- Active item classes: bg-primary/10 text-primary and a 2px left border in primary color
- Nav sections: "Workspace" (all users) and "Administration" (admin only — do not render
  at all for user role, do not just hide it)
- User section at bottom: shadcn Avatar + email text + role Badge (USER or ADMIN)
- Logout button using shadcn Button variant="ghost"

Mobile (< 768px):
- Hide the sidebar, show a bottom tab bar with 4 icons (no labels)
- Admin gets a hamburger icon in a top bar that opens a shadcn Sheet from the left
- Sheet contains the full sidebar navigation

Wrap all existing pages in the app shell by updating the layout files for the
(user) and (admin) route groups. The shell must not appear on /login or /register.

Show me app-shell.tsx before wrapping any pages.
```

### UP-4 — Submit Page

```
@engineer, then @qa

Polish the /submit page. Use shadcn components throughout.

Upload zone:
- Implement drag-and-drop with the native dragover/drop events (no extra library)
- Use shadcn Card as the dropzone container with a dashed border
  (border-dashed border-2 border-border classes on the Card)
- Drag-over state: swap to border-primary bg-primary/5
- Image previews: Next.js Image component, 80x80, object-cover, rounded-md
  with an absolute-positioned Button variant="ghost" size="icon" for removal on hover
- File count and size in text-xs text-muted-foreground using font-mono
- Submit Button: full-width, disabled until files added
  Use shadcn Tooltip wrapping the Button to show "Add at least one image" when disabled

Results panel (right column):
- Use shadcn Tabs (one tab per image, tab trigger = thumbnail)
- Per-image content inside TabsContent:
  - Next.js Image preview, max-h-64, object-contain, bg-card rounded-lg
  - VerdictBadge (lg) below the image, centered
  - "Policy v[n] · [n] categories evaluated" in text-xs text-muted-foreground font-mono
  - CategoryRow list with staggered animation (animation-delay via inline style, 40ms per row)
  - processingError: shadcn Alert with variant="destructive" and a warning icon
  - Appeal Button below the list if outcome is flagged or blocked

Loading state during submission:
- Submit Button: disabled + shadcn Loader2 icon spinning + "Screening..."
- If 3+ images: "Screened 1 of 3" text below button, updated by the mutation logic

@qa — Verify in the browser:
- Drag a file over the dropzone, confirm border turns primary color
- Submit 3 images, confirm each has its own tab
- Confirm CategoryRow stagger animation plays (rows appear with a delay)
- Disable the Groq key, submit, confirm Alert appears (not a blank panel)
```

### UP-5 — History and Verdict Detail

```
@engineer

Polish /history and /history/[submissionId].

## /history

Filter bar using shadcn components:
- Outcome: four shadcn Badge components styled as toggle buttons (not a Select)
  active state: bg-primary/10 border-primary text-primary
- Date range: two shadcn Popover + Calendar components for from/to dates
- Apply filters via TanStack Query query params — no client-side filtering

Table using shadcn Table component:
- Columns: Submitted · Images · Outcomes · Policy · Actions
- Outcomes column: render 3 VerdictBadge (sm) in a flex row
- Expandable rows: clicking a row toggles a shadcn Collapsible below that row
  Collapsible content: grid of thumbnails + VerdictBadge + condensed CategoryRow
- Loading state: HistorySkeleton component (5 skeleton rows)
- Empty state: centered, SVG icon, "No submissions yet", Button → /submit

## /history/[submissionId]

Hero:
- Next.js Image full-width, max-h-80 object-contain bg-card rounded-xl
- VerdictBadge (lg) below image, not overlaid (simpler, more accessible)
- Metadata: shadcn Separator + text-xs text-muted-foreground font-mono

Category breakdown:
- Section heading with shadcn Separator below it
- CategoryRow list, triggered rows first
- shadcn Separator between triggered and clean sections (only if both exist)

Policy snapshot:
- shadcn Collapsible, closed by default
- Trigger text: "View policy snapshot (v[n])"
- Content: read-only PolicyCategoryRow components with disabled prop

Appeal section:
- shadcn Card
- If eligible: shadcn Textarea + Button
- If appeal exists: AppealStatusTimeline
- If approved: nothing (don't render the section at all)
```

### UP-6 — Admin Pages

```
@engineer, then @qa

## /admin/queue

shadcn Card per appeal — denser than user-facing.
Image thumbnail opens in shadcn Dialog (lightbox) on click.
Justification text: full, untruncated, inside a bg-muted rounded-md p-3 block.
Action row: two shadcn Buttons side by side.
  Accept: variant="default" (primary) + shadcn AlertDialog for confirmation.
  Reject: variant="outline" with text-verdict-blocked class — no confirm dialog.
Filter bar: shadcn Select for status + shadcn Popover+Calendar for dates.
Keyboard shortcuts (A/R/J/K): implement with useEffect keydown listener.
Fixed footer bar: "A accept · R reject · J/K navigate" in text-xs text-muted-foreground.
Empty state: shadcn Alert with a checkmark icon — "Queue is empty".

## /admin/verdicts

shadcn Table with filter bar (shadcn Select + Input + Popover Calendar).
Overridden rows: VerdictBadge + a small Badge "OVERRIDDEN" variant="outline".
shadcn Tooltip on the OVERRIDDEN badge showing override details.
Override modal: shadcn Dialog.
  Inside: current VerdictBadge (lg) + three RadioGroup items styled as colored cards
  (border-verdict-* on the selected card) + shadcn Textarea for reason.
  Confirm step inside the same Dialog — just change the dialog body content,
  don't open a second Dialog on top of the first.

## /admin/policy

Two-column layout (CSS grid, 65/35 split).
Left: six PolicyCategoryRow components.
Unsaved changes bar: fixed bottom bar using a div with position sticky bottom-0
  bg-card border-t border-border. Shows count of modified rows + two Buttons.
  Only render this bar when modifiedCategories.length > 0.
Save triggers: toast.success('Policy saved — now version ' + newVersion) via Sonner.
Version badge: animate-verdict-pulse class toggled on save via a brief timeout.
Right: version history as a scrollable list inside shadcn ScrollArea.
  Each version: clickable row that expands (shadcn Collapsible) to show that
  version's category settings in read-only form.

## /admin/analytics

Four StatCards in a CSS grid (2 cols mobile, 4 cols desktop).
StatCard: shadcn Card with a large font-mono number + label + optional trend Badge.

Charts using shadcn Chart wrapper (Recharts under the hood):
  Submissions over time: BarChart, stacked bars in verdict colors.
  Verdict distribution: PieChart with innerRadius (donut), three segments.
  Both charts: tooltips, responsive, formatted axes.
  Use the verdict token colors from globals.css in the chart config.

Tables: shadcn Table, sortable headers where useful.
All numbers: toLocaleString() for comma formatting.

@qa — After all admin pages are done:
- Accept an appeal from /admin/queue → verify /admin/verdicts reflects the new outcome
  without a manual refresh (TanStack Query invalidation check)
- Change a policy in /admin/policy → submit a new image as user → verify new verdict
  references the incremented version number
- Verify analytics numbers are non-zero and formatted with commas
```

### UP-7 — Polish Pass

```
@engineer for fixes, @qa for final verification

## Systematic empty and error state audit

Go through every page and confirm each has all three states:
- Skeleton loading (shadcn Skeleton, matching the real layout shape)
- Empty state (SVG icon + message + optional CTA button)
- Error state (shadcn Alert variant="destructive" + retry button if retryable)

Pages to audit: /submit, /history, /history/[id], /appeals, /admin/queue,
/admin/verdicts, /admin/policy, /admin/analytics.

For each page, tell me: had loading ✅/❌, had empty ✅/❌, had error ✅/❌.
Fix every ❌ before moving on.

## Responsive check

At 375px viewport width:
- Sidebar must be completely hidden — bottom tab bar or hamburger only
- /history table must stack as cards (no horizontal scroll)
- CategoryRow: stack label above bar
- Policy page: single column, version history moves below the editor
- All modals and Dialogs: full-width with proper padding

## Motion audit

Confirm these five animations all work and all respect prefers-reduced-motion:
1. ConfidenceBar fills animate on /submit result reveal
2. CategoryRows stagger in with 40ms delay increments
3. VerdictBadge color transition is 300ms crossfade on override/appeal accept
4. Sonner toasts animate in from bottom-right
5. Policy version badge pulses after save

## @qa — Final browser walkthrough (10 steps)

1. Register new user account
2. Submit 3 images — verify per-image tabs, stagger animation, confidence bars
3. Expand a submission row in /history — verify Collapsible animates open
4. File an appeal on a flagged verdict from /history/[id]
5. Verify the appeal appears in /appeals Pending tab without manual refresh
6. As admin: accept the appeal from /admin/queue — confirm with AlertDialog
7. As user: verify verdict shows APPROVED in /history without manual refresh
8. As admin: override a verdict directly from /admin/verdicts
9. Change a policy in /admin/policy — verify version badge increments with pulse
10. Check /admin/analytics — confirm numbers are real and formatted

Report each step: ✅ pass / ❌ fail (component + file:line) / ⚠️ visual glitch.
All 10 must pass before the UI is considered done.
```
