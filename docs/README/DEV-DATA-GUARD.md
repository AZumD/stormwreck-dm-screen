# DEV-DATA-GUARD.md

## Purpose
Shared helper for live Postgres tests: snapshot the imported Stormwreck Althariel row and fail if a suite mutates it.

## File
`test/lib/dev-data-guard.js`

## Usage
```js
const guard = require("./lib/dev-data-guard");
const before = await guard.snapshotAlthariel(db);
// …isolated live tests…
await guard.assertAltharielUnchanged(db, before, "validate-player");
```

Live suites must use dedicated test campaign/character/user ids and delete them afterward. They must not `UPDATE` `pc-mswdvrcy-u6nnt` or attach leftover controllers to her.
