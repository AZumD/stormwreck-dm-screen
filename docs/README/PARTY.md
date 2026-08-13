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

`window.PARTY` is a derived view (name, HP, AC, portrait, etc.) for map pins and tooltips.

## UI
Map rail **Party** section:
- **+ PC** / **+ NPC** opens a picker of catalogue entries not already in the party
- **×** removes a member from the party (does not delete the catalogue entry)
- Click a card opens the catalogue entity modal when possible

## Wiring
Loaded after `campaign-state.js` in the campaign page. `CampaignApp` calls `PartyRoster.init()` before `MapPanel.init()`.
