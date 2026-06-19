# Moderra — AI Content Moderation Platform

An end-to-end AI-powered image content moderation system. Users upload images; the platform screens each one independently against a configurable policy using the Groq vision API, produces per-image verdicts, and gives users the ability to appeal decisions. Admins manage the policy, review appeals, override verdicts, and monitor platform analytics.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Docker + Docker Compose | Docker ≥ 24, Compose V2 |
| Node.js (local dev only) | 22 LTS |
| Groq API key | Free tier at [console.groq.com](https://console.groq.com) |
| MongoDB | Atlas cluster |

---

## Setup (three steps)

```bash
# 1. Clone the repository
git clone <repo-url> && cd moderra

# 2. Copy the environment file and fill in your values
cp .env.example .env
# Required: set MONGO_URI and GROQ_API_KEY (see Environment Variables below)

# 3. Start the full stack
docker compose up --build
```

The backend container automatically runs the seed script on first boot (idempotent — safe to restart). It creates:
- An admin user at `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- The default policy version (all six categories enabled, 70% threshold, flag-for-review enforcement)

The app is then available at:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:3001/api
- **Swagger docs** → http://localhost:3001/api (interactive)

---

## Environment Variables

All variables live in the root `.env` file (copied from `.env.example`).

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string (e.g. `mongodb+srv://...`) |
| `JWT_SECRET` | ✅ | Secret used to sign JWTs. Use a long random string in production. |
| `JWT_EXPIRES_IN` | — | Token lifetime. Default: `1d`. Accepts `Nd` (days) or `Nh` (hours). |
| `GROQ_API_KEY` | ✅ | Your Groq API key from [console.groq.com](https://console.groq.com). |
| `GROQ_VISION_MODEL` | — | Vision model ID. Default: `meta-llama/llama-4-scout-17b-16e-instruct`. Check [console.groq.com/docs/models](https://console.groq.com/docs/models) for current IDs. |
| `PORT` | — | Backend port. Default: `3001`. |
| `UPLOAD_DIR` | — | Path inside the backend container where uploads are stored. Default: `/app/uploads`. |
| `NEXT_PUBLIC_API_URL` | — | Browser-reachable base URL for the backend. Default: `http://localhost:3001`. |
| `NODE_ENV` | — | `development` or `production`. |
| `SEED_ADMIN_EMAIL` | — | Email address for the seeded admin user. Default: `admin@example.com`. |
| `SEED_ADMIN_PASSWORD` | — | Password for the seeded admin. Must be ≥ 8 chars with upper, lower, and digit. Default: `AdminPass1`. |

---

## Architecture

### Backend — NestJS + Mongoose + Groq
```
backend/src/
  analytics/     GET /admin/analytics (4 aggregation pipelines)
  appeals/       POST /appeals, GET /appeals/me, GET|PATCH /admin/appeals
  auth/          POST /auth/register, POST /auth/login (JWT, httpOnly-style Bearer)
  common/        Guards, decorators, constants, filters, pipes
  moderation/    Groq vision API wrapper (one call per image, structured JSON output)
  policy/        GET /policy/categories, GET|PUT /admin/policy
  submissions/   POST /submissions, GET /submissions, GET /submissions/:id
  verdicts/      GET /admin/verdicts, PATCH /admin/verdicts/:id/override
  users/         User repository used by auth and seed
  database/      Idempotent seed script
```

### Frontend — Next.js App Router + TanStack Query + shadcn/ui
```
frontend/app/
  (user)/        /submit, /history  — user-facing pages
  (admin)/admin/ /appeals, /verdicts, /policy, /analytics  — admin pages
  login/         Shared login page
```

---

## Key Architecture Decisions

### (a) Why PolicyVersion is insert-only, and how old verdicts stay correct after a policy change

Every policy change creates a **new `PolicyVersion` document** and marks the previous one `isActive: false`. No existing document is ever mutated.

More importantly, each `ImageVerdict` embeds a **full snapshot** of the policy configuration used at evaluation time (`policySnapshot`). This snapshot is copied at write time and never updated again — it is the permanent record of exactly what thresholds and enforcement settings were active when that image was screened.

This means a policy change cannot retroactively alter past verdicts, even if the `PolicyVersion` document it references is deactivated or overwritten in the future. The verdict is self-contained. `policyVersionId` on the verdict is a historical reference; `policySnapshot` is the source of truth.

### (b) Why verdicts are per-image, not per-submission, and what that means for appeals

A "submission" is a batch container — it holds one or more images uploaded at the same time. Each image is screened independently by the AI and receives its own `ImageVerdict` document. This matches the brief exactly: *"Each image is screened independently and receives its own verdict."*

The consequence for appeals is deliberate: **appeals attach to `ImageVerdict._id`, never to `Submission._id`**. A user who submits five images and has two flagged can appeal each flagged image independently, without disturbing the others. An admin who overrides one image's verdict touches exactly one `ImageVerdict` document — not the whole batch.

This design avoids the ambiguity of "appealing a submission" when only one image in the batch was blocked.

### (c) How the admin override endpoint differs from accepting an appeal

| | Accept appeal (`PATCH /admin/appeals/:id`) | Direct override (`PATCH /admin/verdicts/:id/override`) |
|---|---|---|
| **Precondition** | A pending appeal must exist | No appeal required at all |
| **Outcome** | Always sets verdict to `approved` | Sets verdict to any outcome (`approved`, `flagged`, or `blocked`) |
| **Record** | Updates the `Appeal` document with decision + adminResponse | Writes `ImageVerdict.override` metadata (by, reason, at) |
| **Use case** | User filed a formal appeal; admin is resolving it | Admin spotted an error directly; no formal process needed |

Accepting an appeal also records override metadata on the `ImageVerdict` (same `override` field), so the audit trail is preserved either way. But the two flows are intentionally separate: one is a structured user-initiated process; the other is a raw admin correction power.

### (d) Why `auto_block` beats `flag_for_review` when both trigger on the same image

A single image can match multiple categories simultaneously. If one category is configured as `auto_block` and another as `flag_for_review`, the system must pick one outcome.

The design chooses **the most severe action**: `auto_block` always wins. This is a deliberate safety-first default — in a content moderation system, it is far less harmful to over-block a single image than to let through content that already triggered a block-level signal. A human admin can always override a block; content that was incorrectly approved cannot be un-seen by the user who received it.

The implementation scans all category results, tracks whether either threshold was triggered, then applies precedence at the end — it is never first-wins or last-wins order, which would be vulnerable to category ordering in the policy definition.

### (e) Why Groq for the moderation engine, and the honest caveat about confidence scores

**Why Groq**: Groq provides very low-latency inference (often sub-second) via their LPU hardware, which matters for a synchronous per-image API call where the user is waiting for results. The free tier is sufficient for development and testing. The `meta-llama/llama-4-scout-17b-16e-instruct` model supports vision input and can produce structured JSON output, matching what the moderation pipeline requires.

**Honest caveat about confidence scores**: The `confidenceScore` field in each category result is the model's **self-reported estimate** — the number the language model assigns to its own classification. It is *not* a calibrated statistical probability derived from a trained classifier with held-out validation data. Two important consequences:

1. Scores are only meaningful **relative to each other within a single model run**, not across different models, prompts, or time.
2. The threshold settings in the policy (e.g. 70%) are tuning knobs, not statistical significance levels. Setting a threshold to 70 means "act when the model claims ≥ 70% confidence" — it does not mean "act only when there is a 70% frequentist probability of the content being harmful."

Treat the confidence score as a signal strength indicator, not a probability. Administrators should calibrate thresholds empirically by reviewing a sample of verdicts at different threshold values.

---

## API Reference

Full interactive documentation is available at **http://localhost:3001/api** (Swagger UI) when the backend is running.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/policy/categories` | User | Active category names only |
| `POST` | `/api/submissions` | User | Upload 1+ images, get verdicts |
| `GET` | `/api/submissions` | User | Own submission history |
| `GET` | `/api/submissions/:id` | User/Admin | Single submission with verdicts |
| `POST` | `/api/appeals` | User | File an appeal on a verdict |
| `GET` | `/api/appeals/me` | User | Own appeals |
| `GET` | `/api/admin/appeals` | Admin | Appeal queue |
| `PATCH` | `/api/admin/appeals/:id` | Admin | Accept or reject an appeal |
| `GET` | `/api/admin/policy` | Admin | Active policy + version history |
| `PUT` | `/api/admin/policy` | Admin | Create new policy version |
| `GET` | `/api/admin/verdicts` | Admin | All verdicts, filterable |
| `PATCH` | `/api/admin/verdicts/:id/override` | Admin | Direct verdict override |
| `GET` | `/api/admin/analytics` | Admin | Platform analytics |
