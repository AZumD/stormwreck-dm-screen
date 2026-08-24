# VALIDATE-AUTH.js

## Purpose
Phase 3A checks: auth/session wiring, production fail-closed behavior, and (when `DATABASE_URL` is set) live Postgres authorization tests.

## Run
```bash
node test/validate-auth.js
```

Included in `npm test`.

## Live tests (DATABASE_URL set)
Temporarily sets `AUTH_REQUIRED=1`. Covers:

- Unauthenticated requests rejected
- Case-insensitive email uniqueness + login normalize
- Session hash storage (no raw token in DB)
- Expired session rejection
- Campaign membership / outsider denial
- Character controller allow/deny
- DM vs player on campaign and `requireAnyDm` (catalogue gate)
- CSRF Origin + Content-Type checks
- Multi-character controller + multi-player campaign
- Logout invalidation
- HTTP login cookie / me / gated catalogue + character APIs

Live suites use a dedicated test campaign and characters (not imported Stormwreck Althariel) and delete them afterward.
