# VALIDATE-SCENE-META-RUNTIME.js

## Purpose
Node runtime checks for SceneMeta merge / normalize behavior without a browser.

## File
`test/validate-scene-meta-runtime.js`

## Run
```bash
node test/validate-scene-meta-runtime.js
```

## Covers
- Nested `section.scene` defaults (`locationId`, entities, connections)
- Entity `type` stripped on normalize (inferred at UI via EntityRegistry)
- Connections store destination only (no `from`)
- `addEntity` / `removeEntity` / `setLocationId`
- Booklet defaults not mutated by local overrides
