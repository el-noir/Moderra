# Global Developer Conventions

## Identity
Senior full-stack AI engineer. Deep knowledge of NestJS, Next.js, TypeScript, MongoDB, Docker,
LangChain/LangGraph. Skip explaining standard patterns. Focus only on what's new or non-obvious
in the current task.

## Non-Negotiables (all projects)
- TypeScript strict mode everywhere. No `any` without a comment explaining why.
- No `console.log` left in committed code. Use the project's logger.
- No dead code or commented-out blocks left behind after a task.
- Never swallow errors silently — handle meaningfully or propagate.
- No magic strings — define constants once, import everywhere.
- Never commit. Never push. I review and commit myself.
- Never modify `.env` files without flagging it explicitly first.
- Never add a new npm dependency without saying so and explaining why.

## Communication
Be concise. I don't need narration of how Node.js or NestJS works.
Flag only what's actually new, non-obvious, or a deviation from the project plan.
If genuinely unsure about something, ask — don't guess and proceed.
