/**
 * Validates map stage aspect stays tied to the image (no expand stretch).
 * Run: node test/validate-map-aspect.js
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
const mapJs = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const layoutJs = fs.readFileSync(path.join(root, "js/core/layout-panels.js"), "utf8");

if (!css.includes("aspect-ratio: var(--map-aspect")) {
  fail("CSS .map-stage must use aspect-ratio: var(--map-aspect, …)");
} else pass(".map-stage uses --map-aspect");

const expandedBlock = css.match(
  /body\.map-mode-expanded\s+\.map-stage[\s\S]*?body\.map-mode-combat\s+\.map-stage\s*\{([\s\S]*?)\}/
);
const expandedCss = expandedBlock ? expandedBlock[1] : "";

if (!expandedCss) {
  fail("Could not find expanded/combat .map-stage rule");
} else {
  if (/aspect-ratio:\s*auto/.test(expandedCss)) {
    fail("expanded .map-stage must not set aspect-ratio: auto (stretches stage vs image)");
  } else pass("expanded .map-stage does not use aspect-ratio: auto");

  if (/flex:\s*1\b/.test(expandedCss) || /flex-grow:\s*[1-9]/.test(expandedCss)) {
    fail("expanded .map-stage must not flex-grow (forces non-image aspect)");
  } else pass("expanded .map-stage does not flex-grow");

  if (!/--map-aspect/.test(expandedCss) && !css.includes("aspect-ratio: var(--map-aspect")) {
    fail("expanded mode should preserve --map-aspect");
  } else pass("expanded mode preserves map aspect variable");
}

if (!mapJs.includes('setProperty("--map-aspect"') && !mapJs.includes("setProperty(\"--map-aspect\"")) {
  fail("map-panel.js must set --map-aspect from image dimensions");
} else pass("map-panel sets --map-aspect");

if (!mapJs.includes("naturalWidth") || !mapJs.includes("naturalHeight")) {
  fail("map-panel.js must read naturalWidth/naturalHeight for aspect");
} else pass("map-panel reads naturalWidth/naturalHeight");

if (!mapJs.includes("syncMapAspect")) {
  fail("map-panel.js missing syncMapAspect helper");
} else pass("map-panel has syncMapAspect");

if (!mapJs.includes("onLayoutChange")) {
  fail("map-panel.js missing onLayoutChange for expand/collapse");
} else pass("map-panel exposes onLayoutChange");

if (!layoutJs.includes("MapPanel?.onLayoutChange")) {
  fail("layout-panels.js should notify MapPanel.onLayoutChange on mode sync");
} else pass("layout-panels notifies MapPanel on layout change");

const docs = [
  "docs/README/MAP-PANEL.md",
  "docs/README/LAYOUT-PANELS.md",
  "docs/README/VALIDATE-MAP-ASPECT.md"
];
for (const d of docs) {
  if (!fs.existsSync(path.join(root, d))) fail(`missing ${d}`);
}
pass("map aspect docs present");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll map-aspect checks passed.");
