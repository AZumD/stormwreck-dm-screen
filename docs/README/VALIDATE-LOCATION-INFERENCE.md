# VALIDATE-LOCATION-INFERENCE.js

## Purpose
Checks that campaign location defaults prefer SceneMeta scene location over the active map.

## File
`test/validate-location-inference.js`

## Run
```bash
node test/validate-location-inference.js
```

## Covers
- `CampaignStateUI.inferLocationId` wiring (scene → map)
- `campaign-app` passes focused scene + section base
- Runtime preference: scene `locationId` beats map; map used when scene has none / cleared
