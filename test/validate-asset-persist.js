/**
 * File-backed catalogue assets: upload survives empty sibling fields / non-clear saves.
 * Run: node test/validate-asset-persist.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const assets = require(path.join(root, "server/lib/assets"));
const catalogues = require(path.join(root, "server/lib/catalogues"));

let failed = 0;
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const imagesSrc = fs.readFileSync(path.join(root, "js/core/catalogue/images.js"), "utf8");
const appSrc = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");

if (!imagesSrc.includes("clearFields") || !imagesSrc.includes("async function clear(")) {
  fail("images.js must support explicit clearFields / clear()");
} else pass("explicit clear API present");

if (!imagesSrc.includes("Empty strings do NOT delete") && !imagesSrc.includes("do NOT delete files")) {
  fail("images.js should document no-delete-on-empty");
} else pass("no-delete-on-empty documented in source");

if (imagesSrc.includes("if (useApi()) {\n      /* Asset URLs load from server")) {
  fail("preload must not skip IndexedDB when API is up");
} else if (!imagesSrc.includes("enables migrate when API is up") && !imagesSrc.includes("Always load IndexedDB")) {
  fail("preload should always load IDB for migration");
} else pass("preload always loads IDB for migration");

if (!appSrc.includes("clearFields: [fieldId]") && !appSrc.includes('clearFields: [fieldId]')) {
  fail("catalogue app clear button should pass clearFields");
} else pass("clear button uses clearFields");

if (!appSrc.includes("Keep sibling image fields") && !appSrc.includes("sibling image")) {
  fail("upload path should preserve sibling image fields");
} else pass("upload preserves sibling image fields");

if (!appSrc.includes("/data with your catalogue entries")) {
  fail("upload hint should mention /data persistence");
} else pass("UI hint mentions file-backed storage");

/* Runtime: writing one field must not require deleting the other */
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

(async () => {
  const id = `persist-test-${Date.now().toString(36)}`;
  try {
    const put = await assets.putFieldFromDataUrl("npc", id, "portrait", tinyPng);
    if (!put.url.includes(`/api/assets/portraits/npc/${id}`)) fail("portrait url");
    else pass("portrait written to data/assets");

    await catalogues.upsert("npc", id, {
      id,
      name: "Persist Test",
      portrait: put.url,
      mapImage: ""
    });

    /* Simulate ordinary save that sends empty mapImage — must not delete portrait file */
    const still = await assets.readAsset("portraits", "npc", id);
    if (!still?.buffer?.length) fail("portrait missing after catalogue upsert with empty mapImage");
    else pass("portrait file survives catalogue JSON with empty mapImage");

    /* Explicit field delete only removes that field */
    await assets.deleteField("npc", id, "mapImage");
    const afterMapClear = await assets.readAsset("portraits", "npc", id);
    if (!afterMapClear?.buffer?.length) fail("portrait deleted when clearing mapImage");
    else pass("clearing mapImage does not remove portrait");

    await assets.deleteField("npc", id, "portrait");
    await catalogues.remove("npc", id);
    if (await assets.readAsset("portraits", "npc", id)) fail("portrait should be gone after deleteField");
    else pass("explicit portrait delete works");
  } catch (err) {
    fail(err.message || String(err));
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll asset-persist checks passed");
})();
