# VALIDATE-LIBRARY-HOME.js

## Purpose
Static checks for the Phase 10 DM Library home: Continue surface, Tools, workspace launch, utilities.

## File
`test/validate-library-home.js`

## Run
```
node test/validate-library-home.js
```

## What it checks
- Continue + campaigns + Tools + schedule summary markup
- Compendium / Player App in Tools (no legacy catalogue sidebar)
- `landing.js` Run/Prep URLs and last-opened tracking
- `library-summary.js` continue picker and summary helpers
- `campaign-app.js` `?workspace=` override and query cleanup
- Library home CSS classes
