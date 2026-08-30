/**
 * Validates scene meta / play-view wiring.
 * Run: node test/validate-scene-meta.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const meta = read("js/core/scene-meta.js");
const ui = read("js/core/scene-ui.js");
const app = read("js/campaign-app.js");
const html = read("campaigns/stormwreck-isle/index.html");
const adventure = read("js/campaigns/stormwreck-isle/adventure.js");
const features = read("js/catalogue-seeds/core-features.js");

if (!meta.includes("window.SceneMeta") || !meta.includes("-scene-meta")) {
  fail("SceneMeta missing");
} else pass("SceneMeta module");

if (!meta.includes("defaultsFromSection") || !meta.includes("section.scene")) {
  fail("SceneMeta must read nested section.scene defaults");
} else pass("nested section.scene defaults");

if (!meta.includes("setLocationId") || !meta.includes("locationId")) {
  fail("SceneMeta missing first-class locationId");
} else pass("SceneMeta locationId API");

if (!meta.includes("addEntity") || !meta.includes("addConnection")) {
  fail("SceneMeta missing entity/connection APIs");
} else pass("SceneMeta APIs");

if (!meta.includes("getLocationId")) fail("SceneMeta missing getLocationId");
else pass("SceneMeta getLocationId");

if (!meta.includes("Write only the keys present")) {
  fail("SceneMeta patch should write partial overrides only");
} else pass("SceneMeta partial patch");

if (!meta.includes("type is inferred via EntityRegistry") && !meta.includes("/* type is inferred")) {
  fail("SceneMeta should not store entity type");
} else pass("entity type not stored");

if (!ui.includes("sceneExtrasHtml") || !ui.includes("data-add-scene-entity")) {
  fail("SceneUI missing tray UI");
} else pass("SceneUI tray + add");

if (!ui.includes("data-set-scene-location") || !ui.includes("openLocationPicker")) {
  fail("SceneUI missing location picker");
} else pass("SceneUI location picker");

if (!ui.includes("data-jump-scene") || !ui.includes("data-add-connection")) {
  fail("SceneUI missing connections");
} else pass("SceneUI connections");

if (!ui.includes("Persist id + optional quantity/note only") && !ui.includes("type comes from EntityRegistry")) {
  fail("SceneUI should not persist entity type");
} else pass("SceneUI addEntity without type");

if (!app.includes("renderPlayScene") || !app.includes("workspace-run")) {
  fail("campaign-app missing play/Run workspace");
} else pass("campaign-app play view");

if (!app.includes('activeWorkspace === "prep"') || !app.includes("renderPlayScene(focusedSceneId")) {
  fail("Run must be default workspace with play scene restore");
} else pass("Run is default runtime");

if (!app.includes("SceneUI.init")) fail("campaign-app missing SceneUI.init");
else pass("campaign-app inits SceneUI");

if (!html.includes("play-view") || !html.includes("scene-entity-dialog")) {
  fail("campaign HTML missing play view / dialogs");
} else pass("campaign HTML play wiring");

if (!html.includes("js/core/scene-meta.js") || !html.includes("js/core/scene-ui.js")) {
  fail("campaign HTML missing scene scripts");
} else pass("scene scripts loaded");

/* Adventure seeds: nested scene, no stored type on entities */
const drownedBlock = adventure.slice(
  adventure.indexOf('id: "drowned-sailors"'),
  adventure.indexOf('id: "inhabitants"')
);
if (!drownedBlock.includes("scene:") || !drownedBlock.includes("locationId:") || !drownedBlock.includes("entities:")) {
  fail("drowned-sailors missing nested scene metadata");
} else pass("drowned-sailors nested scene seed");

if (/entities:\s*\[[^\]]*type\s*:/.test(drownedBlock.replace(/\n/g, " "))) {
  fail("drowned-sailors entities should not store type");
} else pass("drowned-sailors entities have no type field");

if (!adventure.includes("undead-fortitude") || !features.includes("feature-undead-fortitude")) {
  fail("Undead Fortitude feature missing");
} else pass("Undead Fortitude available");

if (!app.includes("renderPlayScene") || !app.includes('setWorkspace("prep"')) {
  fail("Run/Prep workspace wiring missing");
} else pass("Run/Prep workspace modes");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll scene-meta checks passed");
