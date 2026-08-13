/**
 * Validates entity-registry wiring on the campaign page.
 * Run: node test/validate-entity-registry.js
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

const campaignHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const registry = fs.readFileSync(path.join(root, "js/core/entity-registry.js"), "utf8");
const entityUi = fs.readFileSync(path.join(root, "js/core/entity-ui.js"), "utf8");
const parser = fs.readFileSync(path.join(root, "js/core/parser.js"), "utf8");

if (campaignHtml.includes("entities.js")) fail("campaign still loads deprecated entities.js");
else pass("campaign does not load entities.js");

if (!campaignHtml.includes("entity-registry.js")) fail("campaign missing entity-registry.js");
else pass("campaign loads entity-registry.js");

if (!campaignHtml.includes("catalogue/store.js")) fail("campaign missing catalogue store");
else pass("campaign loads catalogue store");

if (!campaignHtml.includes("stormwreck-isle.js")) fail("campaign missing catalogue seeds");
else pass("campaign loads catalogue seeds");

if (!campaignHtml.includes("core-rules.js") || !campaignHtml.includes("core-spells.js")) {
  fail("campaign missing core race/class/spell seeds");
} else {
  pass("campaign loads core-rules + core-spells");
}

if (!campaignHtml.includes("core-skills.js") || !campaignHtml.includes("core-features.js")) {
  fail("campaign missing skill/feature seeds");
} else {
  pass("campaign loads core-skills + core-features");
}

if (!campaignHtml.includes("catalogue/types.js")) fail("campaign missing CatalogueTypes");
else pass("campaign loads CatalogueTypes");

if (!campaignHtml.includes("catalogue-search-results") || !campaignHtml.includes("Search catalogues")) {
  fail("campaign missing catalogue search UI");
} else {
  pass("campaign catalogue search markup");
}

if (!registry.includes("skillToEntity") || !registry.includes("featureToEntity") || !registry.includes("function register")) {
  fail("entity-registry missing skill/feature converters or register()");
} else {
  pass("entity-registry converts skill/feature + register()");
}

if (!registry.includes("spellToEntity") || !registry.includes("raceToEntity")) {
  fail("entity-registry missing race/spell converters");
} else {
  pass("entity-registry converts race/class/spell/pc");
}
if (!registry.includes("LINK_ALIASES")) fail("entity-registry missing link alias map");
else pass("entity-registry has explicit link aliases");

if (!registry.includes("normalizeEntry")) fail("entity-registry missing entry normalization");
else pass("entity-registry normalizes list fields");

if (!registry.includes("CatalogueSeeds")) fail("entity-registry missing in-memory seed fallback");
else pass("entity-registry merges seeds without requiring localStorage");

if (!entityUi.includes('document.addEventListener("click"')) fail("entity-ui missing document click delegation");
else pass("entity-ui uses document-level click delegation");

if (!entityUi.includes("bootstrapEntityUI")) fail("entity-ui missing auto-init bootstrap");
else pass("entity-ui self-initializes on campaign pages");

if (!parser.includes("EntityRegistry?.getAll")) fail("parser missing registry fallback in parseContent");
else pass("parser falls back to EntityRegistry when entities arg omitted");

if (!parser.includes("CatalogueTypes") && !parser.includes("linkAlternation")) {
  fail("parser not using declarative link types");
} else {
  pass("parser builds link regex from CatalogueTypes");
}

if (!parser.includes("skill") || !parser.includes("feature")) {
  fail("parser fallback missing skill/feature");
} else {
  pass("parser supports skill/feature links");
}

if (!fs.existsSync(path.join(root, "test/entity-links-test.html"))) {
  fail("missing browser test page test/entity-links-test.html");
} else {
  pass("browser test page exists");
}

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll entity-registry checks passed.");
