# NestJS Backend Architecture Rules

## Module structure
One module per domain: auth, users, submissions, appeals, policy, verdicts, analytics,
moderation. Each gets its own controller, service, DTOs, and schema file. Do not merge
unrelated domains into one module for convenience.

## Separation of concerns
Controllers validate input and delegate — no business logic in a controller.
Logic lives in services. Constructor-based dependency injection only.

## Validation and serialization
Every request body has a class-validator DTO. Global ValidationPipe runs with
whitelist: true and forbidNonWhitelisted: true.
User.passwordHash uses class-transformer @Exclude() — not a manual delete call.
A global exception filter maps known error types to correct HTTP status codes.

## Shared constants
The six moderation category names, three outcome values, and two enforcement values
are each defined exactly once in backend/src/common/constants/ and imported everywhere.
Never re-declare them as inline string literals in any file.

## Config
All environment variables go through a typed ConfigService/config module.
No process.env.X scattered through business logic.

## Async correctness
When processing multiple images in one submission batch, use Promise.allSettled —
never Promise.all. One image's moderation engine failure must not fail the whole batch.
