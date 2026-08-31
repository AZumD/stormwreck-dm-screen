# VALIDATE-RUN-POLISH.js

## Purpose
Static checks for Campaign Visual Polish Pass 1 — Run workspace composition (compact scene chrome, Prep-only authoring extras).

## File
`test/validate-run-polish.js`

## Run
```
node test/validate-run-polish.js
```

## What it checks
- `renderPlayScene` uses compact `CampaignStateUI.sceneChromeHtml`
- Run does not embed `SceneUI.sceneExtrasHtml` (At this scene / Connections)
- Prep passes `{ authoring: true }` for scene extras
- Collapsible private notes + scene-cue media strip
- No duplicate DONE badge on Run titles
- Party rail width + card hierarchy CSS
