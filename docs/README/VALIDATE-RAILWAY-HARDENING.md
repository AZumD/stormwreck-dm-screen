# VALIDATE-RAILWAY-HARDENING.js

## Purpose
Phase 4B checks for Railway-safe hybrid deployment: startup validation, `DM_DATA_ROOT`, item seed path, `data:init` safety, graceful shutdown, and authenticated campaign create syncing FS + Postgres + DM membership.

## Run
```bash
node test/validate-railway-hardening.js
```

Included in `npm test`.

## Coverage
- Production missing `DM_DATA_ROOT` → startup validation failure
- Local missing `DM_DATA_ROOT` allowed
- `HOST` defaults (loopback local / `0.0.0.0` production)
- `dataRoot()` honors `DM_DATA_ROOT`
- Item seed resolves catalogue dir under alternate data root
- `data:init` empty → succeeds; second run / non-empty → refuses
- Graceful shutdown hooks (idempotent; closes HTTP + db hook)
- File-only campaign create still works
- Live (when `DATABASE_URL` set): authenticated `POST /api/campaigns` creates FS + Postgres row + DM membership

Live suites use disposable users/campaigns and assert imported Althariel is unchanged.
