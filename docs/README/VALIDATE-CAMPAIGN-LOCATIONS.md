# VALIDATE-CAMPAIGN-LOCATIONS.js

## Purpose
Static regression checks for campaign location membership, catalogue UVTT upload, map panel filtering, and DM Library back links.

## File
`test/validate-campaign-locations.js`

## Run
```bash
node test/validate-campaign-locations.js
```

## Checks
- `locations` campaign document kind
- `catalogue-location-maps.js` + API UVTT routes
- `CampaignLocations`, `CampaignLocationsUI`, `MapPanel` integration
- Map dropdown **+ Add location…** opens catalogue picker
- Location catalogue `uvtt` field + `LocalApiClient` helpers
- Campaign HTML script tags
- Sample back links point to `/dm/`
