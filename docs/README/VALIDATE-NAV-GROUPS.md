# VALIDATE-NAV-GROUPS.js

## Purpose
Checks sidebar scene-group wiring: campaign-app helpers, CSS, i18n, and SectionEditor `groupId` normalize/persist.

## Run
```bash
node test/validate-nav-groups.js
```

Included in `npm test`.

## Covers
- `buildNavItems` / `nav-scene-group` / collapse key in `campaign-app.js`
- Group chrome styles
- `addGroup` / delete confirm strings
- Runtime: `groupId` on `getSections`, reject unknown groups, strip on load
