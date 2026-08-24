# VALIDATE-DB-CHARACTERS.js

## Purpose
Phase 2 checks: character import wiring, entity-ref parsing, API routes, and (when `DATABASE_URL` is set) live Postgres multi-character tests.

## Run
```bash
node test/validate-db-characters.js
```

Included in `npm test`.

## Live tests (DATABASE_URL set)
Live suites insert a dedicated test campaign/characters and delete them afterward. They must not mutate imported Stormwreck Althariel (`pc-mswdvrcy-u6nnt`).

- One imported Althariel row (read-only)
- Canonical `name` trimmed; raw catalogue string in `sheet.sourceName`
- Idempotent upsert of a dedicated test PC
- Two characters in one test campaign
- Campaign + character scoped fetch
- Inventory isolation
- State update isolation (on test characters only)
- Regression: imported Althariel unchanged
