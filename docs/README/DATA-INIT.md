# DATA-INIT.mjs

## Purpose
One-shot copy of committed repo `data/` onto an empty persistent volume (`DM_DATA_ROOT`).

## Run
```bash
DM_DATA_ROOT=/path/to/empty/volume npm run data:init
```

`DM_DATA_ROOT` is **required**. The script refuses to run against the default repo `data/` path.

## Behavior
| Situation | Result |
|-----------|--------|
| Destination empty / uninitialized | Copies `catalogues/`, `campaigns/`, `assets/` (layout + any seed files); writes `.initialized` |
| `.initialized` present | Refuse (exit 2) |
| Any catalogue or campaign JSON already present | Refuse |
| Source === destination | Refuse |

Does **not** copy `.env`, secrets, `node_modules`, or `.backup`.

## Safety
- Never wire into `npm start` or automatic deploys
- Never re-run over a live campaign volume
- Safe to invoke again: second run is a no-op refusal

## See also
`docs/README/DEPLOY.md`
