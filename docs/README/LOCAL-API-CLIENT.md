# LOCAL-API-CLIENT.js

## Purpose
Browser HTTP client for the local file-backed API. Domain modules call this instead of raw `fetch`.

## File
`js/core/local-api-client.js` → `window.LocalApiClient`

## Behavior
- Probes `GET /api/health`
- Catalogue CRUD, campaign registry, campaign documents, assets
- Campaign maps / UVTT import helpers
- Revealed NPCs: `listRevealedNpcs`, `revealNpc`, `unrevealNpc` (Phase 5D)
- Integrates with `SaveStatus` (Saving… / Saved / Save failed)
- **Per-key write queue:** same persistence key serializes writes (factory starts only after prior settle); a failed write does not block the next; different keys stay concurrent

## Related
`CatalogueStore`, `CampaignRegistry`, `CampaignState`, `ChronicleStore`, `SceneMeta`, `SectionEditor`, `CampaignPrefs`, `CampaignMapState`
