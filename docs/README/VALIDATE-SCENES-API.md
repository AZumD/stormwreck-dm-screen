# VALIDATE-SCENES-API.js

## Purpose
Regression checks for the scene block parser and DM scene read API (`/api/campaigns/:id/scenes`).

## File
`test/validate-scenes-api.js`

## Run
```bash
node test/validate-scenes-api.js
```

Included in `npm test` (after `validate-campaign-doc-patch`).

## Checks
- `server/lib/scene-blocks.js` exports parseBlocks / read-aloud handling
- Scenes routes present and DM-gated (`requireDmIfAuthRequired`)
- parseBlocks: read-aloud, dm-note, collapse, @refs
- buildSceneList current scene + locationId from scene-meta
- buildSceneDetail includes DM notes + play notes
- Live HTTP against temp `DM_DATA_ROOT`: list, detail, 404

## Related
`docs/README/SCENE-BLOCKS.md`, `server/routes/api.js`
