# TUI (stormwreck)

## Purpose
Native terminal DM tracker client (Go + Bubble Tea). First-class alongside the browser DM and player apps. Server remains canonical. **Scene-first IA:** Home → Library/Campaigns → campaign tabs Scene | Notes | Party | Map | Music (Map secondary).

## Location
`tui/` — binary entry `tui/cmd/stormwreck`

## Packages
| Package | Role |
|---------|------|
| `internal/actions` | Central Action constants + `DefaultBindings` / `Resolve` / `LookupFKey` (F13–F16 stubs). Editing suppresses single-letter globals; `Ctrl+K` master lookup remains available. |
| `internal/nav` | Frame stack (`Push` / `Pop` / `Replace`) for back-navigation history. |
| `internal/layout` | `ModeWide` (≥100 cols) vs `ModeNarrow`; `PaneSizes` for main + inspector. |
| `internal/music` | Optional local `mpv` player (`ErrUnavailable` if missing); `MpvArgs` + cookie HTTP headers. |
| `internal/scene` | `Block` JSON shape + `FormatBlocks` + `FlattenRefs`. |
| `internal/api` | Session cookie client: health/catalogueTypes, campaigns, scenes, documents, music stream. |
| `internal/ui` | Screens + CRT theme (`theme.go`): phosphor green / amber Lip Gloss panes, ANSI-aware wrap/truncate, bordered Scene triple layout (`scene_view.go`). |
| `internal/config` | `--server` required; `--campaign` optional (empty → Home). |

## Hotkeys (summary)
`1`–`5` tabs · `Tab`/`Shift+Tab` panes · `←`/`→` adjust (status/HP/volume) · `Shift+E` scene edit · `Shift+S` switcher · `n` scene notes · `t` clock · `Shift+N` quick notes · `PgUp`/`PgDn` body page · `Ctrl+H` home · `Ctrl+K` lookup · `Ctrl+L` library · `/` search · Party `h/i/c/a` · Music `Space`/`+/-`/`L`/`S` · `q` quit.

## Docs
Full usage, Pi build, controls, mpv optional dep: `tui/README.md`

Architecture contract: `docs/CLIENT-ARCHITECTURE.md`

Scene blocks API: `docs/README/SCENE-BLOCKS.md`

Scene mutation API: `docs/README/SCENE-MUTATE.md`

Requires Go 1.24+ (Bubble Tea ≥ 1.3.2 for Windows AltGr/`@` keyboard layouts).
