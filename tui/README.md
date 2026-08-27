# Stormwreck Terminal DM Client

Native **tracker** TUI for Stormwreck DM Screen. First-class DM client alongside the browser DM app and player companion — not a replacement for either.

## Philosophy

**Scene-first information architecture.** After login you land on Home (Library + Campaigns). Opening a campaign defaults to the **Scene** tab. The ASCII map is secondary and lives only under the **Map** tab.

This is a **tracker**, not a VTT or combat engine. The DM plays D&D; the client displays and edits shared table state (HP, AC, conditions, initiative, notes). It does not simulate rounds, turns, attacks, damage, spells, or condition timers.

The **deployed Stormwreck server remains canonical**. This binary never keeps a local authoritative campaign database.

## Requirements

- Go 1.24+ to build (module toolchain)
- A reachable Stormwreck server with auth + Postgres (same as production / `AUTH_REQUIRED`)
- A normal terminal / TTY (suitable for a Raspberry Pi 3B)
- **Optional:** [`mpv`](https://mpv.io/) on `PATH` for local Music tab playback (browse works without it)

## Configuration

```bash
stormwreck --server https://your-host.example
# optional shortcut straight into a campaign workspace after login:
stormwreck --server https://your-host.example --campaign stormwreck-isle
```

| Flag | Meaning |
|------|---------|
| `--server` | **Required.** Base URL (no hardcoded production URL) |
| `--campaign` | Optional campaign id shortcut (opens Scene tab after login). Empty → Home |
| `--email` | Optional login email (password prompted) |
| `--password` | Optional (prefer interactive prompt; **never stored**) |
| `--poll-ms` | Shared-state poll interval (default 2000) |
| `--config` | Optional JSON file |

Optional config file (`~/.config/stormwreck/config.json` or `STORMWRECK_CONFIG`):

```json
{ "serverUrl": "https://your-host.example", "campaignId": "", "email": "dm@example.com", "pollMs": 2000 }
```

Passwords are never written to config.

## Navigation hierarchy

```
Login → Home
          ├─ Library → catalogue type list → entry detail (read-only)
          └─ Campaigns → Campaign workspace
                ├─ 1 Scene   (default) — blocks + selectable @refs
                ├─ 2 Notes   — document kind "notes" `{ text }`
                ├─ 3 Party   — initiative/HP/AC/conditions table + sheets
                ├─ 4 Map     — ASCII projection (secondary)
                └─ 5 Music   — local mpv over mixer tracks (not campaign authority)
```

Wide terminals (≥100 cols): main | inspector. Narrow: stacked.

## Login

1. `POST /api/auth/login` with email/password
2. Session cookie `sw_session` kept in an in-memory Go cookie jar for the process lifetime
3. HTTP 401 returns to the login screen

No bearer tokens, API keys, or TUI-specific auth.

## Hotkeys

All non-login keys go through `actions.Resolve` (and `LookupFKey` for F13–F16 stubs). While a text field is focused (login, search, notes, party edits), `editing=true` so single-letter globals do not fire.

| Key | Action |
|-----|--------|
| `1`–`5` | Scene / Notes / Party / Map / Music tabs |
| `Ctrl+H` | Home (leave campaign, keep session) |
| `Ctrl+L` | Library overlay (from campaign; Esc returns) |
| `/` | Search / filter (Home, Library) |
| `↑` `↓` / `k` `j` | Move selection |
| `Enter` | Open (campaign, catalogue, sheet, follow ref) |
| `Esc` / Backspace | Back (nav stack restores cursor) |
| `Shift+N` | Notes edit (Notes tab) |
| `h` `i` `c` `a` | Edit HP / initiative / conditions / AC (Party) |
| `Space` | Music play/pause toggle |
| `+` `-` | Volume |
| `L` | Loop toggle |
| `S` | Stop playback |
| `q` / Ctrl+C | Quit |

Unicode and `@` in text fields work via `updateFocusedInput` (Windows AltGr fix).

## Music (local only)

- Loads campaign `music-mixer` document + music catalogue titles
- Streams via `GET /api/catalogues/music/:id/audio/stream` with `Cookie: sw_session=…` passed to mpv `--http-header-fields`
- Playback is **local presentation** — not written back as campaign authority
- If mpv is missing: message shown; list still browsable

## Development

From `tui/`:

```bash
go test ./...
go run ./cmd/stormwreck --server http://127.0.0.1:3000
```

Build:

```bash
go build -o stormwreck ./cmd/stormwreck
```

## Raspberry Pi 3B

```bash
cd tui
GOOS=linux GOARCH=arm GOARM=7 go build -o stormwreck-linux-armv7 ./cmd/stormwreck
```

## Limitations

- **Monster token HP/AC/conditions are read-only** in the TUI (initiative still editable)
- No catalogue editing, combat engine, GPIO, or local campaign DB
- ASCII map uses grid size + shared positions only
- Polling (~2s), not SSE/WebSockets
- Session cookie is process-lifetime only

## Packages

| Package | Role |
|---------|------|
| `internal/actions` | Central Action + bindings / Resolve / F-keys |
| `internal/nav` | Frame stack for back history |
| `internal/layout` | Wide (≥100) vs narrow panes |
| `internal/music` | Optional mpv player |
| `internal/scene` | Block formatting + FlattenRefs |
| `internal/api` | HTTPS client (health, campaigns, scenes, catalogues, music) |
| `internal/ui` | Screens: login, home, library, campaign tabs, overlays |

## Related

- `docs/CLIENT-ARCHITECTURE.md`
- `docs/README/TUI.md`, `docs/README/SCENE-BLOCKS.md`
- Browser DM + player clients remain fully supported
