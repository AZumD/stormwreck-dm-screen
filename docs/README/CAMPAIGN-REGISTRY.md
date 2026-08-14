# CAMPAIGN-REGISTRY.js

## Purpose
Persists user-created campaigns for the DM Library landing page. Built-in booklet campaigns (Stormwreck) stay as static folders; custom campaigns open the shared sandbox shell.

## File
`js/core/campaign-registry.js` → `window.CampaignRegistry`

## Storage
Key: `dm-campaigns` (localStorage)

```json
{
  "version": 1,
  "campaigns": [
    {
      "id": "coastal-hex",
      "title": "Coastal hex crawl",
      "description": "…",
      "level": "",
      "createdAt": 0,
      "updatedAt": 0
    }
  ]
}
```

## API
| Method | Role |
|--------|------|
| `list()` | Campaigns newest-first |
| `get(id)` | One entry or `null` |
| `create({ title, description, level })` | Slug id, save, return entry |
| `update(id, patch)` | Merge fields + bump `updatedAt` |
| `remove(id)` | Delete entry |
| `sandboxUrl(id)` | `campaigns/sandbox/index.html?id=…` |

Ids never collide with `stormwreck-isle`.

## Related
`js/landing.js`, `campaigns/sandbox/`, `js/campaigns/sandbox/adventure.js`
