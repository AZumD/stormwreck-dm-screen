# AUTH.md

## Purpose
Phase 3A authentication and authorization: email/password identity, Postgres server sessions, HttpOnly cookies, and membership/controller checks.

## Files
| Path | Role |
|------|------|
| `server/lib/auth.js` | Passwords (bcryptjs), sessions, cookies, email normalize |
| `server/lib/authorize.js` | `requireUser`, `requireDm`, `requireAnyDm`, `requireCharacterControl`, CSRF mutation checks |
| `db/migrations/0002_phase3_auth.sql` | `password_hash`, `sessions`, case-insensitive email unique index |
| `db/bootstrap-auth.mjs` | Idempotent DM/player bootstrap from env |
| `test/validate-auth.js` | Static + live auth/authorization tests |

## Commands
```bash
npm run db:migrate
npm run db:bootstrap:auth   # requires BOOTSTRAP_* env vars
node test/validate-auth.js
```

## Production fail-closed
When `NODE_ENV=production`, authentication is **always** required. The server refuses to start without `DATABASE_URL` and a `SESSION_SECRET` of at least 32 characters. There is no silent unauthenticated fallback.

Locally, `AUTH_REQUIRED` defaults to `0` so the DM file-backed workflow stays convenient. Set `AUTH_REQUIRED=1` to exercise production-like gates.

## Cookies
Session cookie `sw_session`: HttpOnly, SameSite=Lax, Secure in production (or `COOKIE_SECURE=1` / `TRUST_PROXY=1`). Only a SHA-256 hash of the token is stored in Postgres.

## CSRF (mutations)
Authenticated `POST`/`PUT`/`PATCH`/`DELETE` require `Content-Type: application/json`, or an allowlisted binary upload type (`audio/*`, `application/octet-stream`) for music MP3 uploads. `DELETE` may omit `Content-Type` (no body). If the browser sends `Origin`, it must match `Host` (or `X-Forwarded-Host` when `TRUST_PROXY=1` / production).

## Authorization
| Helper | Use |
|--------|-----|
| `requireDm(campaignId)` | Campaign-scoped DM data (documents, character admin APIs) |
| `requireAnyDm()` | Global DM library (catalogue list/CRUD, export, assets) |
| `requireCampaignMember` | Any member of a campaign |
| `requireCharacterControl` | Player (or DM) for a specific character |

Phase 3B player routes always require a session (`requireUser` / membership / control). They never bypass DM gates; DM document and global catalogue APIs remain DM-only. See `docs/README/PLAYER.md`.

Players must not call legacy `/api/catalogues/*` when auth is required; use `/api/player/campaigns/:id/catalogues/:type/:entryId` instead.
