---
name: api-contract-check
description: Verify all implemented endpoints match the contracts in PROJECT_PLAN.md
  section 5 — method, route, auth, request shape, response shape, and status codes.
  Run after any phase that adds new endpoints.
---

# API Contract Verification

For every endpoint listed in PROJECT_PLAN.md section 5:

1. Confirm HTTP method and route match exactly (prefix /api, plural resource names).
2. Confirm the auth guard and role requirement match.
3. Confirm request body fields and query params match.
4. Confirm response shape matches.
5. Confirm correct HTTP status codes are used:
   - 201 on create, 200 on read/update, 204 on delete with no body
   - 400 validation failure, 401 unauthenticated, 403 wrong role
   - 404 not found or not yours, 409 conflict (e.g. duplicate pending appeal)

Check all endpoints — not only the ones added in the current phase. Earlier endpoints drift.

Output: for each mismatch, list the endpoint, what the spec says, what the implementation
does, and the file:line where the discrepancy lives.
