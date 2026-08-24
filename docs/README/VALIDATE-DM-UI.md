# VALIDATE-DM-UI.js

## Purpose
Static checks for the DM map rail / ambience UI cleanup (tabs, expand mode, Layers, compact ambience).

## File
`test/validate-dm-ui.js`

## Run
```bash
node test/validate-dm-ui.js
```

## Covers
- Map | Party tabs and Party not stacked under map (both campaign HTML shells)
- Primary actions, Layers popover, collapsible Map settings / UVTT
- `LayoutPanels` modes: sidebar | expanded | combat
- Compact ambience strip + Mixer / Pause all / Stop all + separate `#media-dock`
- CSS avoids classic YouTube-hiding patterns; multi-track API hooks present
- Map `--map-aspect` sync; expanded stage does not use `aspect-ratio: auto`
