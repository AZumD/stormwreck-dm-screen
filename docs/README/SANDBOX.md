# SANDBOX adventure.js

## Purpose
Blank adventure shell for user-created campaigns. Meta is loaded from `CampaignRegistry` using the `?id=` query param.

## Files
| Path | Role |
|------|------|
| `js/campaigns/sandbox/adventure.js` | Builds `ADVENTURE` + empty `MAPS` |
| `js/campaigns/sandbox/party.js` | Empty party seed |
| `campaigns/sandbox/index.html` | Shared DM screen shell |

## Load rules
- Valid id in registry → title/level from registry; starter “Opening” scene
- Missing id → “Campaign not found” section + link back to library

Sandbox loads core catalogue seeds (rules/spells/skills/features), not Stormwreck-specific seeds.

## Related
`CampaignRegistry`, `campaign-app.js`, landing page create flow
