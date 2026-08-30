# VALIDATE-PC-CATALOGUE-MIRROR.js

## Purpose
Static checks for player PC create + PC catalogue mirror wiring.

## File
`test/validate-pc-catalogue-mirror.js`

## Run
```
node test/validate-pc-catalogue-mirror.js
```

## What it checks
- `generatePcId` / `bundleToPcEntry` mapping (`sheet.level`, `character_state.system_state`)
- `mergeCatalogueOnlyFields` keeps `tokenImage` on mirror (DM save + player remirror)
- Mirror does not define `primaryCampaignIdForCharacter` or write `sync.campaignId`
- `createMyCharacter` + mirror hooks in `player.js`
- API create, DM `upsertPcFromDm`, remirror route
- Player client `createCharacter` + UI create CTA
- Docs present
