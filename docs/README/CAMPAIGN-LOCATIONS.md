# CAMPAIGN-LOCATIONS.js

## Purpose
Tracks which **location catalogue** entries belong to a campaign. The map panel only lists maps for those locations.

## Files
- `js/core/campaign-locations.js` → `window.CampaignLocations`
- `js/core/campaign-locations-ui.js` → `window.CampaignLocationsUI`
- Persisted as `data/campaigns/{id}/locations.json` (`locationIds: string[]`)

## UI
Campaign **Locations** nav panel:
- Lists campaign locations with map status (placeholder / image / UVTT)
- **Add location** — picker from global location catalogue
- **Remove** — drops from campaign (catalogue entry unchanged)
- **Details** — opens entity modal

## Map integration
`MapPanel.getEffectiveMaps(campaignId)` builds one map per campaign location from:
- Location catalogue `mapImage` / `mapCalibration` (UVTT)
- Static pin definitions in `js/campaigns/*/maps.js` when `locationId` matches

Upload UVTT in the **Location catalogue** (`mapCalibration` field), not per-campaign.

## Related
`docs/README/MAP-PANEL.md`, `docs/README/CATALOGUE.md`, `server/lib/catalogue-location-maps.js`
