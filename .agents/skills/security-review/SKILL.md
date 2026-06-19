---
name: security-review
description: Audit backend code for auth gaps, upload validation issues, data exposure
  risks, and infrastructure misconfigurations. Run before phase 8 or on demand.
---

# Security Review Checklist

Flag findings as CRITICAL (blocks shipping), MODERATE (should fix), or LOW (nice to have).

## Auth
- [ ] bcrypt cost factor >= 10 on password hashing
- [ ] JWT secret sourced from env config, never hardcoded
- [ ] Role checks derived server-side from verified JWT payload, never from request body
- [ ] Admin routes use both JwtAuthGuard AND RolesGuard together — not roles guard alone

## File Uploads
- [ ] MIME type validated server-side before multer processes the file
- [ ] Max file size enforced server-side, not just as a frontend hint
- [ ] Stored filename generated server-side — client filename never used as disk path

## Data Exposure
- [ ] passwordHash excluded from all responses, including nested populated documents
- [ ] Cross-user resource requests return 404, not 403
- [ ] No stack traces or internal paths in error responses

## Infrastructure
- [ ] helmet() enabled on the NestJS app
- [ ] CORS configured with specific frontend origin, not wildcard *
- [ ] POST /submissions has rate limiting (triggers external paid API call per image)
- [ ] All ObjectId route params validated before any DB query

## Output format
For each finding: file:line, severity level, description of the issue, recommended fix.
