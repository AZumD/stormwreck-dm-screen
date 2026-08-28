# VALIDATE-ADD-SCENE-NAV.js

## Purpose
Static checks that the campaign sidebar always exposes **Add scene** (not edit-mode-only), and that adding a scene enables edit mode.

## File
`test/validate-add-scene-nav.js`

## Run
```bash
node test/validate-add-scene-nav.js
```

## Checks
- `buildNav` always appends `nav-add-scene` / `nav-add-scene-btn`
- Add-scene block is outside the `if (editMode)` group-only branch
- `ensureEditMode` + `addPassage` wiring
- i18n `addScene` / `addSceneHint`
- CSS still styles `.nav-add-scene-btn`
