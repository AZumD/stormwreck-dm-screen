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
- Campaign HTML uses `campaign-page` class
