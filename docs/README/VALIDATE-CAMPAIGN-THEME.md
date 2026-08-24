# VALIDATE-CAMPAIGN-THEME.js

## Purpose
Verifies campaign view panel background images exist and are wired in CSS with deploy-safe absolute URLs.

## File
`test/validate-campaign-theme.js`

## Run
```bash
node test/validate-campaign-theme.js
```

## Checks
- `assets/campaign/{left-sidebar,main-body,right-sidebar}.png` present
- `css/style.css` CSS variables and panel rules
- Sidebar/map overlays light enough for dark leather textures
- Thin gold-toned scrollbar on campaign nav rail
- Campaign topbar (`main-chrome`) uses ~15% overlay so desk texture shows through
- Left sidebar uneven navy scrim (~75–90% dark) over fixed artwork; brighter nav text hierarchy
- Campaign HTML uses `campaign-page` class
