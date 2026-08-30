# PC-CATALOGUE-MIRROR.js

## Purpose
Bidirectional sync between campaign characters in Postgres and DM **PC catalogue** JSON files.

## File
`server/lib/pc-catalogue-mirror.js`

## Link
Characters are linked via `characters.catalogue_pc_id` (usually equal to the character id / catalogue `pc-…` id). Campaign participation is **not** stored on catalogue JSON or `characters` — it lives in `campaign_characters` only.

## Flow
1. **Player create** (`POST /api/player/campaigns/:id/characters`) → inserts standalone character + `campaign_characters` row + controller + state → mirrors into `data/catalogues/pc/{id}.json`
2. **Player edits** (sheet/state/inventory/portrait) → best-effort remirror to catalogue
3. **DM PC catalogue save** (`PUT /api/catalogues/pc/:id`) → when linked characters exist, applies entry into Postgres for **every** `campaign_characters` association, then rewrites catalogue from the live character
4. **DM remirror** (`POST /api/campaigns/:id/characters/:characterId/mirror-to-catalogue`) → one-shot push of live sheet → catalogue (e.g. repair Althariel)

## Authority
- Postgres `characters` + `character_state` is the live play sheet (character exists independently of campaigns)
- `campaign_characters` is the sole authority for which campaigns a character participates in
- PC catalogue is the DM-facing editor/projection for linked PCs (character data only; no `sync.campaignId`)
- Last successful write wins (no merge UI)
- **Catalogue-only images** (`tokenImage`, `mapImage`) live on catalogue JSON + disk assets only — mirroring from Postgres preserves them from the incoming DM save body or existing catalogue file

## Exports
`generatePcId`, `bundleToPcEntry`, `mergeCatalogueOnlyFields`, `loadCharacterBundleById`, `findLinkedCharacters`, `mirrorCharacterToCatalogue`, `mirrorCharacterToCatalogueSafe`, `applyCatalogueEntryToCharacter`, `upsertPcFromDm`
