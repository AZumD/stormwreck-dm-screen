/**
 * Validates map measure tape preview + zoom cursor (no grab-when-zoomed).
 * Run: node test/validate-map-measure.js
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

const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const spatialJs = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");

if (/is-zoomed[^\{]*\{[^}]*cursor:\s*grab/.test(css) || /\.map-stage\.is-zoomed\s+\.map-viewport[\s\S]*?cursor:\s*grab/.test(css)) {
  fail("zoomed map viewport must not force cursor: grab");
} else pass("zoomed map does not force grab cursor");

if (!/\.map-viewport\.is-panning[\s\S]*?cursor:\s*grabbing/.test(css)) {
  fail("active pan must still use cursor: grabbing");
} else pass("panning uses grabbing cursor");

if (!spatialJs.includes("paintMeasure") || !spatialJs.includes("map-measure-line--preview")) {
  fail("map-spatial must paint live measure preview line");
} else pass("measure preview paintMeasure present");

if (!spatialJs.includes("snapWorldToCellCenter")) {
  fail("map-spatial snap must use cell-center helper");
} else pass("token drag snaps to cell center");

if (!spatialJs.includes("tokenStylePos") || !spatialJs.includes("findPcLocation")) {
  fail("map-spatial must render PC tokens from partyPositions percent");
} else pass("PC tokens render from canonical partyPositions");

if (/function snapWorld[\s\S]{0,120}els\.snap\?\.checked/.test(spatialJs)) {
  fail("combat token snap must not depend on measure-snap checkbox");
} else pass("combat tokens always snap to cell centers");

if (!spatialJs.includes("dragOffsetPct") || !spatialJs.includes("clientToPercent")) {
  fail("combat token drag should preserve grab offset via clientToPercent");
} else pass("combat token drag preserves grab offset");

if (!/Math\.hypot\(dx, dy\) < 5/.test(spatialJs)) {
  fail("combat token drag should ignore tiny pointer jitter before moving");
} else pass("combat token drag uses movement threshold");

const mapPanelJs = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
if (!mapPanelJs.includes("snapWorldToCellCenter")) {
  fail("map-panel pin drag must snap to cell center");
} else pass("map-panel pin snap uses cell center");

const mapDistJs = fs.readFileSync(path.join(root, "js/core/map-distance.js"), "utf8");
if (!mapDistJs.includes("snapWorldToCellCenter")) {
  fail("map-distance missing snapWorldToCellCenter");
} else pass("map-distance exports cell-center snap");

if (!spatialJs.includes('preview: true') && !spatialJs.includes("preview: true")) {
  fail("pointermove must call paintMeasure with preview: true");
} else pass("pointermove drives tape preview");

if (!css.includes("map-measure-line--preview") || !css.includes("map-measure-dot")) {
  fail("CSS missing measure preview / endpoint styles");
} else pass("measure preview CSS present");

const doc = path.join(root, "docs/README/MAP-SPATIAL.md");
if (!fs.existsSync(doc) || !fs.readFileSync(doc, "utf8").includes("tape")) {
  fail("MAP-SPATIAL.md should document live tape measure");
} else pass("MAP-SPATIAL.md documents tape measure");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll map measure/cursor checks passed.");
