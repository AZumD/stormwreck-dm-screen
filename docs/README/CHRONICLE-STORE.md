# CHRONICLE-STORE.js

## Purpose
Campaign-scoped writing archive: Story So Far, session Chronicle prose, curated Key Events.
Separate from CampaignState History (factual ledger) and DM session notes.

## File
`js/core/chronicle-store.js` → `window.ChronicleStore`

## Storage
| Key | Contents |
|-----|----------|
| `{campaignId}-chronicle` | `{ version, storySoFar, sessions, keyEvents }` |
| `{campaignId}-chronicle-session-order` | `newest` / `oldest` display preference |

Does not write into `{campaignId}-campaign-state`.

## Session entry
`{ session, title, playedDate, inWorldDate, content, updatedAt }`

## Key Event
`{ id, session, title, description, type, importance, sceneId, locationId, entityIds[], sourceHistoryId, order, timestamp }`

Types: discovery, combat, relationship, decision, arrival, loss, victory, revelation, other.
Importance: `normal` | `major`.

## Related
`js/core/chronicle-ui.js`
