# AI Content Moderation Platform — Agent Guide

## Source of Truth
PROJECT_PLAN.md is the canonical specification. Read it fully before starting any task.
Section 3 (Non-Negotiable Design Decisions) overrides any simpler pattern you would
normally reach for. If a task conflicts with section 3, stop and ask before touching code.

## Repository Layout
- `backend/src/` — NestJS modules: auth, users, submissions, appeals, policy, verdicts, analytics, moderation
- `frontend/app/` — Next.js App Router; `(user)/` and `(admin)/` route groups
- `backend/uploads/` — Docker volume mount; no binary data stored in Mongo

## Stack
- Backend: NestJS + TypeScript + Mongoose
- Frontend: Next.js App Router + TypeScript + TanStack Query
- AI Engine: Groq vision API (env: GROQ_API_KEY, GROQ_VISION_MODEL)
- Database: MongoDB (docker-compose service name: mongo)
- Auth: JWT, httpOnly cookie preferred over localStorage

## The Six Design Rules (Section 3 of PROJECT_PLAN.md — follow exactly)

1. PolicyVersion is insert-only. Never call updateOne, findOneAndUpdate, or save() on an
   existing PolicyVersion document. Every policy change inserts a new document and flips
   isActive: false on the previous one.

2. ImageVerdict embeds policySnapshot (full copy of categories/thresholds/enforcement)
   at write time. The embedded copy is the source of truth for that verdict forever —
   not a live reference to the PolicyVersion collection.

3. Appeals and overrides attach to ImageVerdict._id, never to Submission._id.
   A Submission is only a batch container.

4. Disabled categories are excluded from the AI call entirely and never appear in
   categoryResults. "Evaluated but ignored" is not the same as "excluded."

5. computeOutcome: auto_block beats flag_for_review when both trigger on the same image.
   Never first/last-wins order — scan all results, then decide by precedence.

6. AI failure: set outcome = 'flagged', categoryResults = [], processingError = reason.
   Never default to 'approved'. Use Promise.allSettled across a batch — one image's
   failure must not sink the others.

## Shared Constants
Six category names, three outcomes (approved/flagged/blocked), two enforcement values
(auto_block/flag_for_review) are defined once in `backend/src/common/constants/` and
imported everywhere. Never re-declare them as inline strings.

## Validation
- Every request body has a class-validator DTO.
- Global ValidationPipe: whitelist: true, forbidNonWhitelisted: true.
- passwordHash excluded from all API responses including nested populated documents.
- ObjectId route params validated before any DB query.

## Testing
- computeOutcome and policySnapshot-embedding logic have unit tests — pure functions,
  no mocking required.
- Moderation engine always mocked in tests. Never call real Groq API from test runs.
- `npm test` must pass before any phase is marked done.

## Behavioral Defaults
- Never commit or push.
- Never modify docker-compose.yml or .env without flagging it first.
- When in doubt, ask. A wrong assumption in the policy or verdict logic means rewriting
  multiple layers. Asking costs 10 seconds. Guessing wrong costs an hour.
