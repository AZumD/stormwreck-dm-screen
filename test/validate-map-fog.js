/**
 * Validates fog paint event wiring (capture-phase handlers, no self-blocking listener).
 * Run: node test/validate-map-fog.js
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

const fogJs = fs.readFileSync(path.join(root, "js/core/map-fog.js"), "utf8");
const spatialJs = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");

if (!fogJs.includes('"pointerdown"') || !fogJs.includes("true")) {
  fail("map-fog bindDm should listen in capture phase");
} else pass("map-fog bindDm uses capture phase");

if (!fogJs.includes("stopPropagation")) {
  fail("map-fog should stop propagation when painting");
} else pass("map-fog stops propagation while painting");

if (!spatialJs.includes("onFogKeydown") || !spatialJs.includes("undoFogStroke")) {
  fail("map-spatial should bind ctrl+z fog undo");
} else pass("map-spatial binds ctrl+z fog undo");

if (spatialJs.includes("if (fogging) e.stopPropagation()")) {
  fail("map-spatial must not stopPropagation on all fog pointerdowns");
} else pass("map-spatial no longer blocks fog pointer events");

if (!fogJs.includes("commitStroke") || !fogJs.includes("previewStroke")) {
  fail("map-fog missing stroke commit/preview");
} else pass("map-fog commits and previews strokes");

if (!fogJs.includes("DM_FOG_ALPHA = 0.2") || !fogJs.includes("PLAYER_FOG_ALPHA = 1")) {
  fail("map-fog should use light DM fog and 100% player fog");
} else pass("map-fog DM/player opacity split");

if (!fogJs.includes("isPointHidden") || !fogJs.includes("filterVisibleTokens")) {
  fail("map-fog missing fog visibility helpers");
} else pass("map-fog exposes fog visibility helpers");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll map fog checks passed.");
