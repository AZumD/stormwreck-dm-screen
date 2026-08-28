# PARTY.js

## Purpose
Campaign party roster built from PC / NPC catalogue entries. Replaces the old hardcoded `party.js` placeholders.

## File
`js/core/party.js` → `window.PartyRoster`

## Storage
Roster refs live in `CampaignState.party`:

```json
{ "type": "pc|npc", "id": "<catalogue entry id>" }
```

`window.PARTY` is a derived view (name, HP, AC, portrait, etc.) for map pins and tooltips. Portrait prefers catalogue **Map token** (`tokenImage`), then **Portrait**; `tokenImage` is also stored on `window.PARTY` members for map rendering. For PCs linked to Postgres (`catalogue_pc_id`), `PartyRoster.enrichFromPostgres` overlays live HP from `listCharacters` so the Party tab matches combat-sheet state.

## UI
Map rail **Party** tab (not stacked under the map):
- **+ PC** / **+ NPC** opens a picker of catalogue entries not already in the party
- **×** removes a member from the party (does not delete the catalogue entry)
- Click a card opens the **combat sheet** (HP / AC / conditions) for PCs and NPCs; full catalogue remains available from that sheet

## Wiring
Loaded after `campaign-state.js` in the campaign page. `CampaignApp` calls `PartyRoster.init()` before `MapPanel.init()`.
