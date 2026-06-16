# AI Content Moderation Platform — Implementation Plan

## 0. Purpose of this document

This is the canonical spec for this build. It supersedes ambiguity in the original assignment text by resolving every interpretation question up front. Section 3 ("Non-Negotiable Design Decisions") exists specifically to prevent silent misreadings of the original brief — follow it exactly even where it seems to add detail the original brief didn't spell out.

---

## 1. Project Summary

A full-stack platform where users submit images for automated policy-compliance screening across six moderation categories. Each image gets an independent AI-generated verdict (Approved / Flagged for Review / Blocked). Users can appeal disputed verdicts; admins review appeals, override verdicts directly, configure how strictly each category is enforced, and view platform-wide analytics.

**Moderation categories (fixed set of six, exact names):**

| Category | Description |
|---|---|
| Graphic Violence | Depictions of physical harm, gore, or serious injury to humans or animals. |
| Hate Symbols | Imagery associated with extremist ideologies or designated terrorist organizations. |
| Self-Harm | Visual content depicting or glorifying acts of self-inflicted injury. |
| Extremist Propaganda | Content that promotes, recruits for, or glorifies violent extremist movements. |
| Weapons & Contraband | Imagery depicting illegal weapons, drug manufacturing, or trafficking-related content. |
| Harassment & Humiliation | Imagery intended to degrade, threaten, or publicly humiliate an identifiable individual. |

**Roles:** `user` and `admin`. Admin has every user capability plus: appeals queue, manual verdict overrides, policy configuration, analytics dashboard.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | NestJS + TypeScript | Enforced module/controller/service/DTO structure satisfies the "best practices in project structure" grading criterion with less manual scaffolding than Express. Built-in Guards map directly onto the two-role RBAC requirement. |
| Frontend | Next.js (App Router) + TypeScript | Route groups (`(user)`, `(admin)`) give clean role-based separation. Paired with TanStack Query for server state so the UI reflects real backend state after mutations (appeal resolved, policy changed, verdict overridden) without manual refresh logic. |
| Database | MongoDB via Mongoose | Mandated by the assignment. |
| AI moderation engine | Groq vision API (Llama vision model) | Free developer tier, no credit card, OpenAI-compatible endpoint. Verify current vision model ID at console.groq.com before starting — these rotate. If Groq's vision model doesn't support tool-calling alongside image input, fall back to JSON-mode prompting + Zod validation instead of forced tool use. |
| Cache (optional) | Redis | Cache the currently active policy document (read on every submission). Not required for functional correctness — skip if short on time. |
| Image storage | Local Docker volume + multer | Self-contained for `docker-compose up`; no cloud credentials needed to run the demo. Document in the README that production would use S3/object storage instead. |
| Auth | JWT (access token only, no refresh rotation) | Simplest correct option for an assessment timeline. Document this simplification explicitly in the README rather than silently cutting the corner. |
| Containerization | Docker + docker-compose | Required deliverable. |

---

## 3. Non-Negotiable Design Decisions

These are resolved ambiguities from the original brief. Implement exactly this way.

**3.1 — Policy configuration must be versioned and immutable, never mutated in place.**
The brief states policy changes "apply to submissions made after the change and do not retroactively alter existing verdicts." This means policy config cannot be a single document that gets edited — every change must insert a new `PolicyVersion` document and deactivate the previous one. Every verdict stores both a reference to the policy version used (`policyVersionId`) AND an embedded copy of the exact thresholds/enforcement settings used at evaluation time (`policySnapshot`). The embedded copy is the source of truth for that verdict regardless of anything that happens to the version history later.

**3.2 — The appealable/overridable unit is the per-image verdict, not the submission batch.**
A "submission" is a batch of 1+ images. Each image is screened independently and gets its own verdict (this is explicit in the brief: "Each image is screened independently and receives its own verdict"). All later references to appealing or overriding "a submission" actually mean appealing/overriding one image's verdict within that batch. Model `ImageVerdict` as its own collection, separate from `Submission`, and attach appeals/overrides to `ImageVerdict._id`, not to the batch.

**3.3 — Admins can override verdicts directly, independent of the appeal flow.**
The Core Features section (4.x) never mentions this, but the Role table (section 5) says admins get "manual verdict overrides" as a capability separate from "the appeals queue." This needs its own endpoint (`PATCH /admin/verdicts/:id/override`) that lets an admin set any verdict's outcome directly, with a reason, whether or not an appeal was ever filed. This is distinct from accepting an appeal (which also overrides a verdict, but only as a resolution to a filed appeal).

**3.4 — Disabled categories are excluded entirely, not evaluated-and-ignored.**
If a category is disabled in the active policy snapshot, it is never sent to the AI moderation engine for that submission and never appears in that verdict's `categoryResults` array. This saves AI calls and keeps the verdict record an honest reflection of what was actually screened.

**3.5 — Verdict precedence when multiple categories trigger.**
A single image can trigger multiple categories simultaneously, possibly with different enforcement behaviors. Auto-Block always takes precedence over Flag for Review when both are triggered on the same image — the more severe action wins. Pseudocode:

```
function computeOutcome(categoryResults, policySnapshot):
  autoBlockTriggered = false
  flagTriggered = false

  for result in categoryResults:
    policy = policySnapshot.categories.find(c => c.name === result.category)
    if result.confidenceScore >= policy.confidenceThreshold:
      if policy.enforcement === 'auto_block': autoBlockTriggered = true
      else: flagTriggered = true

  if autoBlockTriggered: return 'blocked'
  if flagTriggered: return 'flagged'
  return 'approved'
```

**3.6 — AI service failure must not silently produce "approved."**
If the moderation engine call errors or times out for a given image, do not let the request crash and do not default that image to approved. Set `outcome = 'flagged'`, `categoryResults = []`, and a top-level note (e.g. `processingError: "moderation service unavailable"`) so a human reviews it. When a submission has multiple images, use `Promise.allSettled` across them so one image's AI failure doesn't sink the rest of the batch.

---

## 4. Data Models (Mongoose)

```
User {
  _id, email (unique), passwordHash, role: 'user' | 'admin', createdAt
}

PolicyVersion {
  _id, version: Number, isActive: Boolean, createdAt, createdBy: ObjectId(User),
  categories: [
    {
      name: String,            // one of the six fixed category names
      enabled: Boolean,
      confidenceThreshold: Number,   // 0–100
      enforcement: 'auto_block' | 'flag_for_review'
    }
  ]
}
// Never updated in place. Every change inserts a new version and flips isActive.

Submission {
  _id, userId: ObjectId(User), createdAt,
  imageVerdictIds: [ObjectId(ImageVerdict)]
}
// Thin batch container only.

ImageVerdict {
  _id, submissionId: ObjectId(Submission), userId: ObjectId(User),
  imagePath: String, originalFilename: String, createdAt,
  outcome: 'approved' | 'flagged' | 'blocked',
  categoryResults: [
    { category: String, classification: 'detected' | 'not_detected', confidenceScore: Number, reasoning: String }
  ],
  policyVersionId: ObjectId(PolicyVersion),
  policySnapshot: { categories: [ ... ] },   // embedded copy, immutable
  processingError: String | null,
  override: { isOverridden: Boolean, by: ObjectId(User), reason: String, at: Date } | null,
  appealId: ObjectId(Appeal) | null
}

Appeal {
  _id, imageVerdictId: ObjectId(ImageVerdict), userId: ObjectId(User),
  justification: String,
  status: 'pending' | 'accepted' | 'rejected',
  adminResponse: String | null, reviewedBy: ObjectId(User) | null, reviewedAt: Date | null,
  createdAt
}
// Unique index: only one 'pending' appeal allowed per imageVerdictId at a time.

AuditLog {        // optional, recommended — see section 11
  _id, actorId: ObjectId(User), action: String, targetId: ObjectId, metadata: Object, createdAt
}
```

---

## 5. API Surface

All routes prefixed `/api`. Auth via `Authorization: Bearer <jwt>`. Role-gated routes use a `RolesGuard` + `@Roles()` decorator.

**Auth**
- `POST /auth/register` — `{ email, password }` → `{ user }`
- `POST /auth/login` — `{ email, password }` → `{ accessToken, user }`

**Submissions** (user)
- `POST /submissions` — multipart, 1+ images → runs moderation engine synchronously per image (concurrent), creates `Submission` + `ImageVerdict`s, returns the full result
- `GET /submissions` — own history; query params: `outcome`, `category`, `dateFrom`, `dateTo`
- `GET /submissions/:id` — own submission with populated verdicts (admin can fetch any)

**Appeals**
- `POST /appeals` (user) — `{ imageVerdictId, justification }`; reject if outcome is `approved` or a pending appeal already exists for that verdict
- `GET /appeals/me` (user) — own appeals + status
- `GET /admin/appeals` (admin) — queue, default filter `status=pending`
- `PATCH /admin/appeals/:id` (admin) — `{ decision: 'accepted' | 'rejected', adminResponse }`; on accept, set linked `ImageVerdict.outcome = 'approved'` and record override metadata

**Policy** (admin manages; users get a read-only category list)
- `GET /policy/categories` (any authenticated user) — names of currently enabled categories only, no thresholds/enforcement exposed
- `GET /admin/policy` (admin) — full active `PolicyVersion` + version history
- `PUT /admin/policy` (admin) — `{ categories: [...] }` → inserts a new `PolicyVersion`, deactivates the previous one

**Verdicts / overrides** (admin)
- `GET /admin/verdicts` — list/filter all verdicts: `outcome`, `category`, `userId`, `dateFrom`, `dateTo`
- `PATCH /admin/verdicts/:id/override` — `{ outcome, reason }` → direct override, independent of appeal flow

**Analytics** (admin)
- `GET /admin/analytics` — single consolidated response:
  ```
  {
    submissionsOverTime: [{ date, count }],
    verdictDistribution: { byOutcome: {...}, byCategory: {...} },
    appealStats: { total, resolutionRate, accepted, rejected, pending },
    userRankings: { bySubmissionCount: [...], byViolationCount: [...] }
  }
  ```

---

## 6. AI Moderation Engine

One Groq vision API call per image, listing only the categories enabled in the current policy snapshot (never call out disabled categories — see 3.4). Force structured JSON output (tool-calling if supported by the chosen vision model, otherwise JSON-mode + Zod schema validation as a fallback). Include the exact category descriptions from section 1 of this document in the prompt, plus confidence calibration anchors (e.g. 0–30 = no resemblance, 30–70 = ambiguous, 70–100 = clear match) so scores are at least internally consistent across calls. Use `temperature: 0` for determinism.

Be honest in the README that the confidence score is the model's self-reported estimate, not a calibrated statistical probability from a trained classifier — that distinction matters and shouldn't be glossed over.

Expected per-image response shape (what the prompt should request):
```json
{
  "results": [
    { "category": "Graphic Violence", "classification": "not_detected", "confidenceScore": 12, "reasoning": "..." }
  ]
}
```

Test the actual category prompts against 5–6 sample images before building anything else around this service — free-tier and open-weight vision models can be more conservative about even describing self-harm/extremist content than a frontier model would be, and that's worth discovering in hour one, not the night before the deadline.

---

## 7. Suggested Folder Structure

```
backend/
  src/
    auth/            (controller, service, guards, JWT strategy, DTOs)
    users/
    submissions/
    appeals/
    policy/
    verdicts/        (admin override endpoints)
    analytics/
    moderation/       (isolated AI engine service — swappable provider)
    common/          (RolesGuard, @Roles decorator, interceptors)
    app.module.ts, main.ts
  uploads/            (Docker volume mount target)
  Dockerfile

frontend/
  app/
    (auth)/login, register
    (user)/submit, history, appeals
    (admin)/queue, policy, overrides, analytics
    components/
    lib/              (api client, TanStack Query hooks)
  Dockerfile

docker-compose.yml
.env.example
README.md
```

---

## 8. Environment Variables

```
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
GROQ_API_KEY=
GROQ_VISION_MODEL=
PORT=
UPLOAD_DIR=
NEXT_PUBLIC_API_URL=
NODE_ENV=
```

---

## 9. Build Order (vertical slices — always keep something demoable)

1. Docker skeleton running (empty backend, empty frontend, mongo) — get this working before writing real features.
2. Auth + roles (register/login/JWT/guards) + seed script: one default admin user, one default `PolicyVersion` with all six categories enabled, threshold 70, enforcement `flag_for_review`.
3. Policy CRUD (backend only) — submissions can't be scored without an active policy to score against.
4. Moderation engine service, standalone — verify it works against sample images before wiring it into the submission flow.
5. Submission endpoint + history view (backend + minimal frontend) — this is the core "meaningful AI integration" the assignment is grading.
6. Appeal workflow (backend + frontend, both roles).
7. Admin verdict override endpoint + policy configuration admin UI.
8. Analytics endpoints + dashboard UI — lowest engineering risk, safest thing to cut down to a plain table if time runs short.
9. Polish: loading/error/empty states, Docker Compose finalization, README.

If squeezed for time: cut analytics depth first (a table is fine, charts are not required). Do not cut policy versioning or the override endpoint — those are the parts most likely being specifically tested.

---

## 10. Definition of Done

- [ ] `docker-compose up` runs the entire stack from a clean clone with no manual steps beyond copying `.env.example`
- [ ] Register/login works for both roles; route guards correctly block cross-role access
- [ ] Submitting 1+ images produces an independent verdict per image, each with a full per-category breakdown for every *enabled* category only
- [ ] A verdict embeds the policy snapshot used at evaluation time; changing policy afterward does not alter that verdict
- [ ] Auto-Block correctly takes precedence over Flag for Review when both trigger on the same image
- [ ] User can file an appeal on a flagged/blocked verdict; cannot file a second pending appeal on the same verdict; cannot appeal an approved one
- [ ] Admin can accept/reject an appeal; acceptance flips the verdict to approved
- [ ] Admin can override any verdict directly, independent of whether an appeal exists
- [ ] Admin policy changes create a new version and never mutate history; old verdicts remain unaffected
- [ ] Analytics endpoint returns submission volume over time, verdict distribution by outcome/category, appeal resolution stats, and user rankings
- [ ] README documents setup, all env vars, and the key architecture decisions from section 3 of this document

---

## 11. Worth Adding If Time Allows

An `AuditLog` collection capturing policy changes, verdict overrides, and appeal decisions (actor, action, target, timestamp). Cheap to add, demonstrates security-conscious design in a moderation system specifically. Not required for the core grading criteria but a strong differentiator in the README.
