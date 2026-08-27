# VALIDATE-TUI-LOOKUP.js

## Purpose
Regression checks for the TUI master catalogue lookup (`Ctrl+K` / `app.lookup`).

## File
`test/validate-tui-lookup.js`

## Run
```bash
node test/validate-tui-lookup.js
```

Requires Go on `PATH`. Runs focused `go test` under `tui/` for lookup bindings and filter helpers.

## Checks
- `actions.Resolve("ctrl+k")` → `app.lookup` (including while editing)
- `BuildLookupHits` / `FilterLookupHits` / `LookupHitLabel` across catalogue types

## Related
`docs/README/TUI.md`, `tui/README.md`, `tui/internal/ui/catalogue.go`, `tui/internal/actions/actions.go`
