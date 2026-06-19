# Global Agent Boundaries

## Source of truth
PROJECT_PLAN.md is authoritative. If anything you are about to do conflicts with it, or
is not covered by it, stop and ask rather than improvising a default. Section 3 overrides
any simpler or more conventional CRUD pattern you would normally reach for.

## Before writing code
- Never assume a package is installed. Check package.json before importing anything new.
  Install explicitly and say so if it is missing.
- For any new feature touching a domain entity, produce the TypeScript interface and
  Mongoose schema first, show them, and wait for approval before writing service logic.

## What you may not do without asking first
- Do not modify .env, .env.example, or docker-compose.yml without flagging it and
  explaining why.
- Do not add a new dependency unless the current task genuinely requires it.
- Do not commit or push. Developer reviews and commits.
- Do not delete or rewrite an existing file's logic wholesale when a targeted edit works.

## Code hygiene
- No commented-out dead code left behind.
- No console.log debugging statements left in committed code.
- No swallowed errors — never catch and continue silently.
- No `any` in TypeScript unless explicitly justified in an inline comment.
- Be concise. Flag only what is new, non-obvious, or a deviation from PROJECT_PLAN.md.
