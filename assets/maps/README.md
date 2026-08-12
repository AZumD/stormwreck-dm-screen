# Map images

## Preferred: Location catalogue upload

1. Open **Location catalogue** from the DM Library
2. Edit the location (e.g. Dragon's Rest)
3. Upload a map image (PNG/JPG, max ~2 MB)
4. Return to the campaign page and refresh / refocus the window

The campaign map panel uses the uploaded `mapImage` when present. Otherwise it falls back to the placeholder SVG in `assets/maps/`.

Maps in `js/campaigns/stormwreck-isle/maps.js` set `locationId` to the catalogue link id (`dragons-rest`, `seagrow-caves`, …).

## Fallback assets

Placeholder SVGs:

- `island-overview.svg`
- `dragons-rest.svg`
- `seagrow-caves.svg`

You can still drop files here and point `image:` in `maps.js` at them.

## Pins

Default pin `x` / `y` are percentages in `maps.js` / `party.js`.

On the campaign map: **drag a pin** to move it. Positions save in localStorage (`{campaignId}-pin-positions`, `{campaignId}-party-positions`).
