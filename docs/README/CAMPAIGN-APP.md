# CAMPAIGN-APP.js



## Purpose

Main controller for a campaign DM screen: **Run**, **Prep**, **Map**, and **Session** workspaces, plus Reference overlay, universal command palette, search, and map chrome.



## File

`js/campaign-app.js`



## Depends on

`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `CampaignState`, `CampaignStateUI`, `DayTimeUI`, `ChronicleStore`, `ChronicleUI`, `SceneMeta`, `SceneUI`, `PartyRoster`, `MapPanel`, `LayoutPanels`, `CommandPalette`, campaign `ADVENTURE` / `MAPS`, `I18N`



## Workspaces

| Workspace | Behavior |

|-----------|----------|

| **Run** (default) | Live DM: focused Play scene, prev/next, status/notes, Reference tool, Party/Music utility rail, catalogue search. No authoring chrome. |

| **Prep** | Document scroll + authoring (edit mode, groups, DnD, add scene/group). Scrollspy tracks the visible section. |

| **Map** | Same MapPanel instance promoted to a full canvas workspace; left nav becomes map browser; Current Scene returns to Run. |

| **Session** | Notes \| Log \| Chronicle \| Progress tabs in `#session-view`; last tab in `sessionTab` pref. Current Scene returns to Run. |



Toolbar **Run | Prep | Map | Session** (`#workspace-run` … `#workspace-session`). Persisted as `workspace` in campaign prefs.



`activeWorkspace` is separate from `activeView` (`play` | `document` | `panel` | `map` | `session`). Reference from Map/Session uses overlay classes (`workspace-map--panel`, `workspace-session--reference`) without wiping underlying workspace state.



## Content views

| Mode | Behavior |

|------|----------|

| **Play** | One focused scene (used in Run) |

| **Document** | Continuous scene scroll (used in Prep) |

| **Session** | Tabbed session tools host (`#session-view`) |

| **Panels** | Reference overlay (`#panel-view`) from sidebar Tools or deep links |



Deep links may use leaf ids (`npcs`, `history`, …) or `reference:…` / `session:…`. Session leaf ids and `session:*` shim into **Session** workspace + tab. Last Reference/Session tab remembered in prefs.



Scenes come from `SectionEditor.getSections` as one flat ordered list. The sidebar may nest scenes under one-level collapsible **groups**.



On boot, `syncCampaignChrome` sets the sidebar title from `ADVENTURE.meta`. Workspace + edit mode are applied before `restoreInitialScene` (hash → current scene → first scene; Map/Session workspaces restore directly).



## Campaign play state

- Scene status/notes via `CampaignStateUI`

- **Campaign time** compact toolbar control (`DayTimeUI`) — popover for tenday + time + presets; persists in `CampaignState.clock`

- **Current scene** toolbar jumps to the saved current section (disabled when none is marked current); from Map/Session switches to Run first

## Viewed scene vs current scene

| Concept | Source | Used for |
|---------|--------|----------|
| **Viewed/focused scene** | `focusedSceneId`, Run play view, Prep scrollspy | Sidebar highlight, scene navigation, Reference “In this scene” in Run/Prep |
| **Current scene** | `CampaignState.getCurrentSceneId()` only | **Current Scene** toolbar/command — never inferred from browsing |

Navigating to a scene (sidebar, palette, hash) changes the viewed scene only; it does not mark a scene current, complete, or skipped.

## Campaign play state (continued)

- NPC modals gain campaign memory through `EntityUI.addModalEnricher`



## Prep / edit mode

- Entering **Prep** turns edit mode on; **Run** turns it off (no separate Edit toggle on the Run toolbar)

- Delete / Link / inline Edit controls only while edit mode is on

- **+ Add scene** / **New group** / drag-reorder appear in Prep only; `ensureEditMode` switches to Prep if needed

- **Link scene** opens the SceneUI connection picker

- Passage editor draft is preserved across window `focus`, scene-meta refreshes, and soft re-renders



## Key helpers

| Function | Role |

|----------|------|

| `loadWorkspace` / `saveWorkspace` / `setWorkspace` | Run \| Prep \| Map \| Session state |

| `showSessionWorkspace` / `renderSessionWorkspace` / `switchSessionTab` | Session workspace host + tabs |

| `showReferencePanel` / `showReferenceTab` | Reference overlay + tab routing |
| `getReferenceContextSceneId` | Scene for “In this scene” (viewed scene, not always current) |
| `closeReferencePanel` / `isReferenceOpen` | Close Reference and restore underlying workspace |
| `bindGlobalEscape` | Escape stack: modal → palette → campaign time → Reference |

| `showPanelView` | Compatibility shim; session ids → Session workspace |

| `getSections` | Effective passage list |

| `renderPlayScene` | Focused scene runtime |

| `renderScrollDocument` | Document HTML + scene extras |

| `jumpToSection` | Play focus or document scroll by workspace |

| `addPassage` / `deletePassage` | Create / remove passages |

| `ensureEditMode` | Ensure Prep + edit mode when authoring |

| `buildNav` / `bindNavDragReorder` | Sidebar list, Prep-only authoring chrome |

| `openSectionEditor` | Inline title/content editor |

| `bindCommandPalette` | Universal search/command palette (Ctrl+K) |

