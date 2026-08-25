# BACKUP-DUAL-STORE.mjs

## Purpose
One-shot dual-store backup helper for the Railway hybrid deploy: archive the `DM_DATA_ROOT` volume and optionally `pg_dump` Postgres. Keeps both halves of the campaign system together for restore.

## Run
```bash
DM_DATA_ROOT=/data BACKUP_DIR=./.backup-out npm run backup:dual
```

| Variable | Required | Meaning |
|----------|----------|---------|
| `DM_DATA_ROOT` | yes | Volume root to tar (catalogues, campaigns, assets, `.backup`) |
| `BACKUP_DIR` | no | Output parent (default `./.backup-out`) |
| `DATABASE_URL` | no | When set, attempts `pg_dump --format=custom` |

Never wire into `npm start` or automatic deploys.

## Output
Creates `BACKUP_DIR/dual-<UTC-stamp>/` with:
- `volume-data.tar` — full volume tree
- `postgres.dump` — when `pg_dump` succeeds
- `POSTGRES-SKIPPED.txt` / `POSTGRES-MANUAL.txt` — when dump is missing
- `CHECKLIST.txt` + `manifest.json`

## Restore checklist
1. Restore **Postgres** and **volume** from the **same** backup stamp (do not mix ages).
2. Prefer: restore Postgres → mount/extract volume → restart web → `GET /api/health`.
3. Smoke: DM login + campaign write; player sheet HP; music playback if used.
4. **Never** run `data:init` over a restored live volume.

## See also
`docs/README/DEPLOY.md` — hybrid architecture and manual backup notes
