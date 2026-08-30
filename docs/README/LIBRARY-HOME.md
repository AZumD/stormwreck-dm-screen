# LIBRARY-HOME

## Purpose
DM Library as the DM home base — Continue, campaigns, tools, schedule summary, and utilities.

## Files
| File | Role |
|------|------|
| `dm/index.html` | Library shell (Continue, Campaigns, Tools, Schedule, Data & backup) |
| `js/landing.js` | Auth, rendering, campaign launch tracking |
| `js/core/library-summary.js` | Lightweight prefs/state/scene summaries (no adventure load) |
| `css/landing.css` | Library home layout and cards |

## Hierarchy
1. **Continue** — last opened campaign (or featured Stormwreck), with session/time + current scene; two-column card with primary Continue + secondary Run/Prep
2. **Campaigns** — all campaigns on translucent card surfaces; **+ New campaign** in section header
3. **Tools** — Compendium, Schedule (expands full calendar), Player App
4. **Next session** — compact summary in Tools column; **Full schedule** expands the calendar inline
5. **Schedule** — full panel collapsed by default; expand via Tools, Next session, or `#library-schedule`
6. **Data & backup** — import/export in footer

## Continue selection
`localStorage` key `dm-last-campaign-id`, updated when any campaign link is clicked from the Library. Falls back to Stormwreck Isle if unset.

## Direct Run / Prep launch
```
campaigns/stormwreck-isle/index.html?workspace=run
campaigns/sandbox/index.html?id=…&workspace=prep
```

`CampaignApp.readLaunchWorkspace()` applies the override once, persists via `CampaignPrefs.workspace`, then strips the query param.

## Summary data sources (lightweight)
| Field | Source |
|-------|--------|
| Session | `prefs.session` |
| Day/time | `campaign-state.clock` |
| Current scene | `campaign-state.scenes` where `status === "current"` |
| Scene title | `section-structure.scenes[].title` |

Loaded via `LocalApiClient.getCampaignDocument` or matching localStorage keys — never loads adventure JS, maps, or catalogues.

## Tests
`node test/validate-library-home.js`
