# LANDING.md

## Purpose
DM Library landing page controller: render user campaigns and create new sandbox campaigns. Served at `/dm/` (root `/` is the DM/Player gate — see `HOME.md`).

## File
`js/landing.js` (loaded from `dm/index.html` after `campaign-registry.js`)

## Behavior
| Action | Result |
|--------|--------|
| Page load | Lists `CampaignRegistry` entries under Stormwreck |
| **Create new campaign** | Dialog → create registry entry → open sandbox |
| Open user card | Navigates to `campaigns/sandbox/index.html?id=` |

## Markup hooks
- `#user-campaign-list`
- `#create-campaign-btn`
- `#create-campaign-dialog` / `#create-campaign-form`

## Related
`CampaignRegistry`, `css/landing.css`, `campaigns/sandbox/`, `docs/README/HOME.md`
