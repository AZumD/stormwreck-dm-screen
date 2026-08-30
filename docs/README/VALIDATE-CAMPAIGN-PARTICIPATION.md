# VALIDATE-CAMPAIGN-PARTICIPATION.md

## Purpose
Validates `campaign_characters` as authoritative participation, attach/detach APIs, party scoping, and DM state DTO adapter.

## File
`test/validate-campaign-participation.js`

## Run
```
node test/validate-campaign-participation.js
```

## What it checks
- `characters.js` attach/detach + joins on `campaign_characters`
- No production reads/writes of `characters.campaign_id` (column dropped in migration `0006`)
- No singular `campaignId` on generic character DTOs (`toMechanicalDto`)
- PC catalogue mirror has no `primaryCampaignIdForCharacter` or `sync.campaignId`
- Player attach/detach routes + UI
- `stateRowToApiDto` for DM HP/conditions
- Live: column absent, attach, detach, dual-campaign, auth boundaries, party scoping, Stormwreck import idempotency, Althariel guard
