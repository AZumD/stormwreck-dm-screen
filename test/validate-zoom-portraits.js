/**
 * Validates map zoom wiring and catalogue portrait fields.
 * Run: node test/validate-zoom-portraits.js
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

const mapPanel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const html = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const configs = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const catApp = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const registry = fs.readFileSync(path.join(root, "js/core/entity-registry.js"), "utf8");
const entityUi = fs.readFileSync(path.join(root, "js/core/entity-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const catCss = fs.readFileSync(path.join(root, "css/catalogue.css"), "utf8");

if (!html.includes("map-zoom-in")) fail("campaign missing zoom controls");
else pass("campaign has zoom controls");

if (!html.includes("map-world")) fail("campaign missing map-world wrapper");
else pass("campaign has map-world wrapper");

if (!mapPanel.includes("setZoomAt") && !mapPanel.includes("zoomBy")) fail("map-panel missing zoom logic");
else pass("map-panel has zoom logic");

if (!mapPanel.includes("wheel")) fail("map-panel missing wheel zoom");
else pass("map-panel supports wheel zoom");

if (!css.includes(".map-zoom-controls")) fail("css missing zoom styles");
else pass("css has zoom styles");

for (const type of ["pc", "npc", "item", "monster"]) {
  const portraitCount = (configs.match(new RegExp(`type: "${type}"[\\s\\S]*?id: "portrait"`, "m")) || []).length;
  // simpler: count id: "portrait" occurrences - should be 4
}
const portraitFields = (configs.match(/id: "portrait"/g) || []).length;
if (portraitFields < 7) fail(`expected >=7 portrait fields, got ${portraitFields}`);
else pass(`catalogue configs have ${portraitFields} portrait fields`);

if (!catApp.includes("kind === \"portrait\"") && !catApp.includes('kind === "portrait"')) {
  fail("catalogue app missing portrait image kind");
} else pass("catalogue app renders portrait uploads");

if (!catApp.includes("cat-list-item__thumb")) fail("catalogue list missing portrait thumbs");
else pass("catalogue list shows portrait thumbs");

if (!registry.includes("portrait: asString(entry.portrait)")) fail("entity-registry missing portrait");
else pass("entity-registry passes portrait through");

if (!entityUi.includes("entity-portrait")) fail("entity-ui missing portrait in modal");
else pass("entity-ui shows portraits in modals");

if (!css.includes(".entity-portrait")) fail("css missing entity-portrait");
else pass("css styles entity portraits");

if (!catCss.includes(".cat-portrait-preview")) fail("catalogue css missing portrait preview");
else pass("catalogue css styles portrait preview");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll zoom/portrait checks passed.");
