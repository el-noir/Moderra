# Security Rules

## This is a moderation platform — security lapses here are doubly embarrassing
Treat upload validation and output encoding as first-class requirements given the
product's entire purpose is screening untrusted content.

## Auth
- Passwords hashed with bcrypt, cost factor 10 or higher. Never store or log plaintext.
- Role checks happen server-side only, derived from the verified JWT payload.
  Never trust a client-sent role field on any request body.
- Admin routes use both JwtAuthGuard and RolesGuard together. Never roles guard alone.
- Prefer httpOnly cookie for the JWT. If using localStorage, state it explicitly.

## File uploads
- Restrict accepted MIME types to images only; reject anything else before multer writes.
- Enforce max file size server-side — frontend checks are bypassable.
- Never use the client-provided filename for the stored file path. Generate server-side.

## Data exposure
- Never return passwordHash in any response, including nested populated documents.
- Cross-user resource requests return 404, not 403. Do not confirm resource existence.

## Infrastructure
- helmet() middleware enabled on the NestJS app.
- CORS configured with the specific frontend origin, never a wildcard *.
- Rate-limit POST /submissions — it triggers an external AI API call per image.
- Validate all ObjectId route params before querying to avoid unhandled cast exceptions.
- Never log secrets, tokens, or full request bodies on auth routes.
