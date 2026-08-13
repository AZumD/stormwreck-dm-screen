# CAMPAIGN-STATE.js

## Purpose
Campaign-scoped play state: scene status/notes, NPC memory, timeline history, and party roster. Adventure text and catalogue entries stay immutable defaults.

## File
`js/core/campaign-state.js` → `window.CampaignState`

## Storage
Single localStorage key: `{campaignId}-campaign-state`

```json
{
  "version": 1,
  "scenes": { "<sectionId>": { "status": "unseen|current|completed|skipped", "notes": "" } },
  "npcMemory": {
    "<entityLinkId>": {
      "attitude": "",
      "mood": "",
      "lastSeenLocation": "",
      "lastSeenSession": null,
      "notes": [],
      "flags": []
    }
  },
  "timeline": [
    {
      "id": "tl-…",
      "timestamp": "ISO",
      "session": 2,
      "sceneId": "",
      "locationId": "",
      "entityId": "",
      "type": "interaction|note|scene",
      "text": "…"
    }
  ],
  "party": [
    { "type": "pc", "id": "<catalogueId>" },
    { "type": "npc", "id": "<catalogueId>" }
  ]
}
```

Does **not** replace `{campaignId}-notes`, `-checklist`, or `-session`.

## API (high level)
| Area | Methods |
|------|---------|
| Scenes | `getSceneState`, `setSceneStatus`, `setSceneNotes`, `getCurrentSceneId` |
| NPC memory | `getNpcMemory`, `updateNpcMemory`, `logInteraction` |
| Timeline | `getTimeline`, `addTimelineEntry`, `updateTimelineEntry`, `deleteTimelineEntry` |
| Party | `getParty`, `addPartyMember`, `removePartyMember`, `isInParty` |

Marking a scene **current** demotes any previous current scene to **completed** (change manually if needed).

`logInteraction` always writes a timeline entry. Pass `addToNotes: true` to also append the text to NPC memory notes (UI checkbox defaults off).

NPC keys prefer the entity link id from `EntityRegistry` (same id used by modals).

Party membership is catalogue refs only — display fields come from the live PC/NPC catalogues via `PartyRoster`.