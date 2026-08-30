# VALIDATE-ADD-SCENE-NAV.js

## Purpose
Static checks that **Add scene** lives in the Prep/edit-mode authoring block, and that adding a scene enables Prep/edit mode.

## File
`test/validate-add-scene-nav.js`

## Run
```bash
node test/validate-add-scene-nav.js
```

## Checks
- `buildNav` appends `nav-add-scene` inside the `if (editMode)` authoring block (with New group)
- `ensureEditMode` switches to Prep when needed
- `addPassage` calls `ensureEditMode`
- i18n `addScene` / `addSceneHint`
- CSS still styles `.nav-add-scene-btn`
