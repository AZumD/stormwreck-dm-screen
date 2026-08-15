# LOCAL-API-CLIENT.js

## Purpose
Browser HTTP client for the local file-backed API. Domain modules call this instead of raw `fetch`.

## File
`js/core/local-api-client.js` → `window.LocalApiClient`

## Behavior
- Probes `GET /api/health`
- Catalogue CRUD, campaign registry, campaign documents, assets
- Integrates with `SaveStatus` (Saving… / Saved / Save failed)

## Related
`CatalogueStore`, `CampaignRegistry`, `CampaignState`, `ChronicleStore`, `SceneMeta`, `SectionEditor`, `CampaignPrefs`, `CampaignMapState`
