# Stormwreck Terminal DM Client

Native **tracker** TUI for Stormwreck DM Screen. It is a first-class DM client alongside the browser DM app and the browser player companion — not a replacement for either.

## Philosophy

This is a **tracker**, not a VTT or combat engine. The DM plays D&D; the client displays and edits shared table state (HP, AC, conditions, initiative, map positions). It does not simulate rounds, turns, attacks, damage, spells, or condition timers.

The **deployed Stormwreck server remains canonical**. This binary never keeps a local authoritative campaign database.

## Requirements

- Go 1.24+ to build (module toolchain)
- A reachable Stormwreck server with auth + Postgres (same as production / `AUTH_REQUIRED`)
- A normal terminal / TTY (no desktop required — suitable for a Raspberry Pi 3B)

## Configuration

```bash
stormwreck --server https://your-host.example --campaign stormwreck-isle
```

| Flag | Meaning |
|------|---------|
| `--server` | Base URL (no hardcoded production URL) |
| `--campaign` | Campaign id |
| `--email` | Optional login email (password prompted) |
| `--password` | Optional (prefer interactive prompt; **never stored**) |
| `--poll-ms` | Shared-state poll interval (default 2000) |
| `--config` | Optional JSON file |

Optional config file (`~/.config/stormwreck/config.json` or `STORMWRECK_CONFIG`):

```json
{ "serverUrl": "https://your-host.example", "campaignId": "stormwreck-isle", "email": "dm@example.com", "pollMs": 2000 }
```

Passwords are never written to config.

## Login

1. `POST /api/auth/login` with email/password
2. Session cookie `sw_session` kept in an in-memory Go cookie jar for the process lifetime
3. HTTP 401 returns to the login screen

No bearer tokens, API keys, or TUI-specific auth.

## Controls

| Key | Action |
|-----|--------|
| ↑ / ↓ or `k` / `j` | Select entity |
| `h` | Edit HP (`-3`, `+2`, `=5`, or `5/10`) — PC/NPC only |
| `i` | Edit initiative (`0` clears tracker entry) |
| `c` | Edit conditions — PC/NPC only |
| `a` | Edit AC — PC/NPC only |
| `r` | Refresh now |
| `q` / Ctrl+C | Quit |
| Enter / Esc | Confirm / cancel edit |

Portrait-oriented layout: connection header, ASCII map, initiative/stat table, selected details, key hints.

## Development

From `tui/`:

```bash
go test ./...
go run ./cmd/stormwreck --server http://127.0.0.1:3000 --campaign stormwreck-isle
```

Build:

```bash
go build -o stormwreck ./cmd/stormwreck
```

## Raspberry Pi 3B

Cross-compile on a development machine:

```bash
cd tui
GOOS=linux GOARCH=arm GOARM=7 go build -o stormwreck-linux-armv7 ./cmd/stormwreck
```

Copy `stormwreck-linux-armv7` to the Pi and run it in a TTY/SSH session:

```bash
./stormwreck-linux-armv7 --server https://your-host.example --campaign stormwreck-isle
```

## Current limitations (MVP 1)

- **Monster token HP/AC/conditions are read-only** — editing would require replacing `map-state.tokens[mapId]` arrays (cross-client clobber risk). Initiative for monsters is still editable via `initiativeTracker` PATCH.
- Passive map uses grid size + shared positions only (no image-to-ASCII, walls optional/not required).
- Passive Perception shows only if present on the PC sheet; the server has no dedicated PP field.
- Polling (~2s), not SSE/WebSockets.
- Session cookie is process-lifetime only (not persisted to disk).
- No catalogue editing, inventory, music, chronicle, or character creation.

## Related

- `docs/CLIENT-ARCHITECTURE.md`
- Browser DM + player clients remain fully supported
