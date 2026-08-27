# Client architecture

How Stormwreck DM Screen treats the server, browser clients, and the native TUI.

## Canonical source

The **server** (`/api` + file-backed campaign documents + optional Postgres) is the canonical application and data source.

Clients are views and editors over that API. They must not keep a separate authoritative campaign database.

## First-class clients

| Client | Role |
|--------|------|
| **Browser DM** | Existing campaign screen, catalogues, map rail, combat sheet — fully supported |
| **Browser player** | Existing `/player/` companion — fully supported |
| **Native TUI DM** | Second DM client (`tui/` — Go + Bubble Tea; scene-first IA; e.g. Raspberry Pi 3B) |

The TUI does **not** replace the browser DM client. Both DM clients share the same online server. See `tui/README.md`.

## How the TUI connects

- Use the existing HTTPS `/api` against the deployed server.
- Authenticate with `POST /api/auth/login` and keep the returned **session cookie** (same as the browser).
- No bearer / API-token auth.
- No CORS changes for the TUI: browser clients stay same-origin; a native client is not a browser origin.
- Do not ship a local authoritative copy of campaign state on the Pi.
- IA: Home (Library + Campaigns) → campaign tabs Scene | Notes | Party | Map | Music. Map is secondary; Scene is default.

## Shared campaign / table state

Campaign documents (especially `map-state`) are shared through the API:

- `GET` / `PUT` — full document read/replace
- `PATCH` — partial update with server-side deep merge (objects merge, arrays replace, `null` deletes a key)

Browser `CampaignMapState.patch()` sends only the partial patch when the API is available, then reconciles with the returned document.

## Presentation vs game state

- **Authoritative game / table state** — HP, conditions, map tokens, pin positions, `initiativeTracker`, party, scene status, etc. — lives on the server.
- **Client-only presentation preferences** (layout chrome, local UI toggles) must not become authoritative game state.

## Application philosophy

This software is a **tracker**, not a D&D combat engine.

It remembers what the DM sets. It does not introduce combat mode, encounter lifecycle, rounds, turn advancement, action economy, automatic attacks/damage, spell resolution, or condition countdowns.

Initiative is temporary shared table state in `map-state.initiativeTracker` only:

```json
{
  "pc:<characterId>": { "name": "…", "initiative": 18, "kind": "pc" },
  "npc:<catalogueId>": { "name": "…", "initiative": 12, "kind": "npc" },
  "tok:<tokenId>": { "name": "…", "initiative": 7, "kind": "monster" }
}
```

Initiative `0` / blank means absent from the tracker.

## Related

- `docs/README/SERVER.md`, `docs/README/AUTH.md`
- `docs/README/CAMPAIGN-MAP-STATE.md`, `docs/README/LOCAL-API-CLIENT.md`
- `docs/README/COMBAT-SHEET-MODAL.md`, `docs/README/DEEP-MERGE.md`
