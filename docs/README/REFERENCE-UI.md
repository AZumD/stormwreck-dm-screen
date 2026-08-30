# REFERENCE-UI.js

## Purpose
Live campaign quick-reference overlay: Overview with scene context, pins, recents, plus NPC/Monster/Location category browsers.

## File
`js/core/reference-ui.js` → `window.ReferenceUI`

## Depends on
`ContentParser`, `SceneMeta`, `EntityRegistry`, `EntityUI`, `CampaignPrefs`, `CampaignLocationsUI` (locations tab), campaign-app API callbacks

## Views
| Tab | Content |
|-----|---------|
| **Overview** | In this scene · Pinned · Recent · Browse shortcuts |
| **NPCs** | Full entity grid |
| **Monsters** | Full entity grid |
| **Locations** | Campaign locations panel or grid |

Default when opening Reference (sidebar, `reference`, Ctrl+K → Reference): **Overview**.

`reference:npcs` / `reference:monsters` / `reference:locations` still open category tabs directly.

## Scene context (“In this scene”)
Uses the **currently viewed scene**, resolved by `campaign-app.getReferenceContextSceneId()`:

| Workspace | Context scene |
|-----------|----------------|
| **Run** | Focused/play scene |
| **Prep** | Scrollspy/focused scene, else CampaignState current |
| **Map** / **Session** | CampaignState current scene |

Sources (conservative — no fuzzy prose matching):

1. `SceneMeta` cast + `locationId`
2. Explicit `@npc:` / `@monster:` / `@location:` and `[[type:id]]` links in section content

Only **npc**, **monster**, **location** types appear in overview lists.

## Pins & recents
Stored in campaign prefs as stable `{ type, id }` refs:

- `referencePins` — persisted per campaign
- `referenceRecent` — up to 8 entries, most recent first, deduped

Entity opens are tracked centrally via `EntityUI.addOpenListener` → `ReferenceUI.trackEntityOpen`.

Pin/unpin: entity modal button + **Unpin** on pinned overview cards.

## Render deduplication
Overview hides duplicates without mutating stored lists:

1. **In this scene** — full list
2. **Pinned** — omits ids already in scene context
3. **Recent** — omits ids in scene context or pinned

## Run
```
node test/validate-reference-ui.js
```
