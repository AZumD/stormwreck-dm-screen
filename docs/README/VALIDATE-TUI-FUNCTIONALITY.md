# VALIDATE-TUI-FUNCTIONALITY.js

## Purpose
Regression checks for the TUI functionality pass: scene editor/switcher helpers, clock adjust, sheet rows, and updated key bindings (`←`/`→` adjust, `Tab` panes, `Shift+E`/`Shift+S`, `Shift+N` quick notes).

## File
`test/validate-tui-functionality.js`

## Run
```bash
node test/validate-tui-functionality.js
```

Requires Go on `PATH`. Runs focused `go test` under `tui/` for UI helpers and actions bindings.

## Checks
- `CycleSceneStatus` / `NextSceneStatus`
- `FilterSceneSwitcher` / `RankSceneSwitcher`
- `AdjustClockMinutes` / `AdjustClockDay` / `AdjustInt` / `FormatClockCompact`
- `BuildSheetRows` (HP + inventory/spell links)
- Actions: `shift+e`, `shift+s`, `ctrl+s` while editing, `left`→`AdjustDec`, `tab`→`PaneNext`, `shift+n`→`NotesQuick`
- `normalizePrintableKey` / textinput `@` path

## Related
`docs/README/TUI.md`, `tui/README.md`, `tui/internal/ui/clock.go`, `scene_switch.go`, `sheet_rows.go`, `tui/internal/actions/actions.go`
