# VALIDATE-DB-CHARACTERS.js

## Purpose
Phase 2 checks: character import wiring, entity-ref parsing, API routes, and (when `DATABASE_URL` is set) live Postgres multi-character tests.

## Run
```bash
node test/validate-db-characters.js
```

Included in `npm test`.

## Live tests (DATABASE_URL set)
- Idempotent Althariel import (no duplicates)
- Canonical `name` trimmed; raw catalogue string in `sheet.sourceName`
- Two characters in one campaign
- Campaign + character scoped fetch
- Inventory isolation
- State update isolation
