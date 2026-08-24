# PC-CATALOGUE-MIRROR.js

## Purpose
Bidirectional sync between campaign characters in Postgres and DM **PC catalogue** JSON files.

## File
`server/lib/pc-catalogue-mirror.js`

## Link
Characters are linked via `characters.catalogue_pc_id` (usually equal to the character id / catalogue `pc-…` id).

## Flow
1. **Player create** (`POST /api/player/campaigns/:id/characters`) → inserts character + controller + state → mirrors into `data/catalogues/pc/{id}.json`
2. **Player edits** (sheet/state/inventory/portrait) → best-effort remirror to catalogue
3. **DM PC catalogue save** (`PUT /api/catalogues/pc/:id`) → when linked characters exist, applies entry into Postgres then rewrites catalogue from the live character
4. **DM remirror** (`POST /api/campaigns/:id/characters/:characterId/mirror-to-catalogue`) → one-shot push of live sheet → catalogue (e.g. repair Althariel)

## Authority
- Postgres is the live play sheet
- PC catalogue is the DM-facing editor/projection for linked PCs
- Last successful write wins (no merge UI)

## Exports
`generatePcId`, `bundleToPcEntry`, `loadCharacterBundleById`, `findLinkedCharacters`, `mirrorCharacterToCatalogue`, `mirrorCharacterToCatalogueSafe`, `applyCatalogueEntryToCharacter`, `upsertPcFromDm`
