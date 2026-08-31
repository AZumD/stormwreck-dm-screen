/**
 * Validates collapsible facet filter panel in catalogue sidebar.
 * Run: node test/validate-catalogue-facet-panel.js
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

const appCode = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const cssCode = fs.readFileSync(path.join(root, "css/catalogue.css"), "utf8");

const appChecks = [
  ["data-cat-facets-panel", "facet panel wrapper"],
  ["cat-facets-panel", "facet panel class"],
  ["activeFacetCount", "active facet count helper"],
  ["cat-facets-panel--active", "active filter styling hook"],
  ['querySelector("[data-cat-facets-panel]")?.remove()', "dispose removes facet panel"]
];

for (const [needle, label] of appChecks) {
  if (!appCode.includes(needle)) fail(`app.js missing ${label} (${needle})`);
  else pass(`app.js ${label}`);
}

if (!appCode.includes('createElement("details")') || !appCode.includes("cat-facets-panel__summary")) {
  fail("app.js should wrap facets in <details> summary");
} else {
  pass("app.js uses collapsible details/summary");
}

if (appCode.includes('host.querySelectorAll("[data-facet-id]").forEach((select) => {')) {
  fail("app.js should use delegated change handler (avoid listener leak on rerender)");
} else {
  pass("app.js facet change uses delegation");
}

const cssChecks = [
  ".cat-facets-panel",
  ".cat-facets-panel__summary",
  ".cat-facets-panel--active",
  ".cat-facets-panel[open]"
];

for (const sel of cssChecks) {
  if (!cssCode.includes(sel)) fail(`catalogue.css missing ${sel}`);
  else pass(`catalogue.css ${sel}`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll catalogue facet panel checks passed.");
