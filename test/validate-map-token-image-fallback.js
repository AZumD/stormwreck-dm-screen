/**
 * Validates map token image error fallback (initials instead of invisible token).
 * Run: node test/validate-map-token-image-fallback.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

const mapToken = fs.readFileSync(path.join(root, "js/core/map-token-size.js"), "utf8");
const spatial = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const catalogueApp = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const octopus = fs.readFileSync(
  path.join(root, "data/catalogues/monster/sw-spore-servant-octopus.json"),
  "utf8"
);

if (!mapToken.includes("tokenLabelHtml") || !mapToken.includes("map-grid-token__label--fallback")) {
  fail("MapTokenSize missing tokenLabelHtml fallback helper");
} else pass("tokenLabelHtml fallback helper");

if (mapToken.includes('onerror="this.remove()"')) {
  fail("tokenImageHtml should not use bare this.remove() onerror");
} else pass("tokenImageHtml avoids bare remove onerror");

if (!mapToken.includes("map-grid-token--has-img")) {
  fail("tokenImageErrorAttr should restore frame when image fails");
} else pass("tokenImageErrorAttr restores visible frame");

if (!spatial.includes("tokenLabelHtml")) {
  fail("map-spatial renderGridToken should include hidden fallback label");
} else pass("renderGridToken includes fallback label");

if (!panel.includes("tokenLabelHtml(label, false)")) {
  fail("map-panel calibrated pins should show initials when no image");
} else pass("calibrated pins show initials without image");

if (!catalogueApp.includes("refreshMapTokenArt") || !catalogueApp.includes("MapPanel.refreshTokens")) {
  fail("catalogue app should refresh map tokens after tokenImage upload");
} else pass("catalogue refreshMapTokenArt hook");

const octopusData = JSON.parse(octopus);
if (octopusData.size !== "Medium") {
  fail(`spore servant octopus should be Medium, got ${octopusData.size}`);
} else pass("spore servant octopus is Medium (1×1 grid — not a size bug)");

const sandbox = {
  window: {},
  CatalogueStore: { _data: { monster: [octopusData] }, loadAll: () => [], get: () => octopusData },
  PARTY: [],
  EntityRegistry: null,
  CatalogueImages: { MARKER: "__idb__", hydrate: (_t, e) => e, getSync: () => "" },
  LocalApiClient: { isAvailable: () => false }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(mapToken, sandbox);
const MTS = sandbox.window.MapTokenSize;

const label = MTS.tokenLabelHtml("Spore Servant Octopus", true);
if (!label.includes("map-grid-token__label--fallback") || !label.includes("hidden")) {
  fail("tokenLabelHtml fallback should be hidden");
} else pass("tokenLabelHtml hidden fallback");

const html = MTS.tokenImageHtml("/missing.png", "Spore Servant Octopus", "/fallback.png");
if (!html.includes('data-fallback="/fallback.png"')) {
  fail("tokenImageHtml should include data-fallback");
} else pass("tokenImageHtml data-fallback attr");

if (!html.includes("dataset.tried") || !html.includes("map-grid-token--has-img")) {
  fail("tokenImageHtml onerror should try fallback then restore label frame");
} else pass("tokenImageHtml chained fallback + label restore");

const visible = MTS.tokenLabelHtml("Spore", false);
if (!visible.includes(">Sp<") || visible.includes("hidden")) {
  fail("tokenLabelHtml visible label");
} else pass("tokenLabelHtml visible initials");

const docs = fs.readFileSync(path.join(root, "docs/README/VALIDATE-MAP-TOKEN-IMAGE-FALLBACK.md"), "utf8");
if (!docs.includes("validate-map-token-image-fallback.js")) fail("docs missing");
else pass("docs README present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll map token image fallback checks passed.");
