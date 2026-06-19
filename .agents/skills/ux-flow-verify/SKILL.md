---
name: ux-flow-verify
description: Walk through complete user journeys in the browser using Antigravity's
  built-in browser. Verifies that shadcn components render correctly in context, TanStack
  Query invalidation fires after mutations, and Sonner toasts appear at the right moments.
---

# UX Flow Verification — shadcn Edition

At each step, verify three things:
1. Correct data is shown (matches the API response)
2. UI updates after mutations WITHOUT a manual page refresh (TanStack Query invalidation)
3. Sonner toast appears with the correct message and variant

## Submission flow
1. Log in → navigate to /submit
2. Drag a file onto the dropzone → confirm Card border turns primary color
3. Add 2 more files → confirm thumbnail previews appear with remove buttons
4. Click Submit → confirm Button shows Loader2 spinner + "Screening..." text
5. Results appear → confirm:
   - Each image has its own Tab
   - VerdictBadge renders with correct color for each image
   - CategoryRow stagger animation plays
   - ConfidenceBar fills animate from left to right
6. Navigate to /history → confirm new submission appears without refresh

## Appeal flow
1. Click a flagged verdict in /history → expand the row
2. Navigate to /history/[id] → confirm AppealStatusTimeline is absent initially
3. Click appeal button → fill Textarea → submit
4. Confirm: Sonner toast "Appeal submitted" appears bottom-right
5. Navigate to /appeals → confirm the new appeal is in Pending tab immediately
6. As admin → /admin/queue → find the appeal
7. Click Accept → confirm shadcn AlertDialog appears for confirmation
8. Confirm after accepting: Sonner toast appears, appeal moves out of queue
9. As user → /appeals → confirm appeal is now in Resolved tab
10. As user → /history/[id] → confirm VerdictBadge has transitioned to APPROVED (300ms)

## Policy flow
1. As admin → /admin/policy → modify a threshold on one category
2. Confirm modified row shows left border in primary color + "modified" label
3. Confirm sticky bottom bar appears with unsaved count
4. Click "Save as New Version"
5. Confirm: Sonner toast with new version number, version badge pulses
6. As user → submit an image → confirm verdict references new version number
7. Open an old verdict → confirm its policySnapshot still has old threshold values

## Override flow
1. As admin → /admin/verdicts → find a verdict with no appeal
2. Click Override → confirm shadcn Dialog opens
3. Select a new outcome → confirm the correct verdict-* border appears on the radio card
4. Fill reason → click Override Verdict
5. Confirm confirmation step appears inside the same Dialog (not a second one)
6. Confirm after override: Sonner toast, table row VerdictBadge updates without refresh
7. Hover the OVERRIDDEN badge → confirm shadcn Tooltip shows override details

## Reporting
For each step: ✅ Pass / ❌ Fail (file:line + description) / ⚠️ Glitch (description).
List which TanStack Query keys were invalidated and confirm each one fired.
