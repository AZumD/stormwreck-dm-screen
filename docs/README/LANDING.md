# LANDING.js

## Purpose
DM Library landing page controller: render user campaigns and create new sandbox campaigns.

## File
`js/landing.js` (loaded from `index.html` after `campaign-registry.js`)

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
`CampaignRegistry`, `css/landing.css`, `campaigns/sandbox/`
