/**
 * Validates fullscreen map mode: page shell, drawer, open button, URL builder.
 * Run: node test/validate-map-fullscreen.js
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

const fullscreenHtml = fs.readFileSync(
  path.join(root, "campaigns/map-fullscreen/index.html"),
  "utf8"
);
const fullscreenJs = fs.readFileSync(path.join(root, "js/core/map-fullscreen.js"), "utf8");
const fullscreenAppJs = fs.readFileSync(path.join(root, "js/map-fullscreen-app.js"), "utf8");
const mapPanelJs = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const stormHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const sandboxHtml = fs.readFileSync(path.join(root, "campaigns/sandbox/index.html"), "utf8");

const requiredIds = [
  "map-panel",
  "map-stage",
  "map-viewport",
  "map-world",
  "map-image",
  "map-pins",
  "map-select",
  "map-primary-actions",
  "map-fullscreen-drawer",
  "map-fullscreen-drawer-toggle",
  "map-pin-dialog",
  "entity-modal"
];

for (const id of requiredIds) {
  if (!fullscreenHtml.includes(`id="${id}"`)) fail(`fullscreen page missing #${id}`);
  else pass(`fullscreen page has #${id}`);
}

if (!fullscreenHtml.includes("map-fullscreen-page") || !fullscreenHtml.includes("map-panel--fullscreen")) {
  fail("fullscreen page missing body/panel classes");
} else pass("fullscreen page has fullscreen classes");

if (!fullscreenJs.includes("buildFullscreenUrl") || !fullscreenJs.includes("openInNewTab")) {
  fail("map-fullscreen.js missing URL builder / open");
} else pass("map-fullscreen.js exports open + URL builder");

if (!fullscreenJs.includes("map-fullscreen-drawer") || !fullscreenJs.includes("localStorage")) {
  fail("map-fullscreen.js missing drawer collapse persistence");
} else pass("map-fullscreen.js persists drawer state");

if (!fullscreenAppJs.includes("MapPanel.init") || !fullscreenAppJs.includes("loadCampaignBundle")) {
  fail("map-fullscreen-app.js missing bootstrap");
} else pass("map-fullscreen-app.js bootstraps MapPanel");

if (!mapPanelJs.includes("map-fullscreen-page") || !mapPanelJs.includes("getActiveMapId")) {
  fail("map-panel.js missing fullscreen / getActiveMapId support");
} else pass("map-panel.js supports fullscreen + getActiveMapId");

if (!css.includes(".map-fullscreen-drawer") || !css.includes("body.map-fullscreen-page")) {
  fail("style.css missing fullscreen layout rules");
} else pass("style.css has fullscreen layout");

for (const [label, html] of [
  ["stormwreck", stormHtml],
  ["sandbox", sandboxHtml]
]) {
  if (!html.includes('id="map-fullscreen-btn"')) fail(`${label} missing Fullscreen button`);
  else pass(`${label} has Fullscreen button`);

  if (!html.includes("map-fullscreen.js")) fail(`${label} missing map-fullscreen.js script`);
  else pass(`${label} loads map-fullscreen.js`);
}

if (fullscreenJs.includes("URLSearchParams") && fullscreenJs.includes("campaign")) {
  pass("URL builder sets campaign query param");
} else fail("URL builder should set campaign param");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll fullscreen map checks passed.");
