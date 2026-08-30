/**
 * Validates catalogue image upload wiring (file-backed + legacy IDB).
 * Run: node test/validate-catalogue-images.js
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

const app = read("js/core/catalogue/app.js");
const store = read("js/core/catalogue/store.js");
const images = read("js/core/catalogue/images.js");
const mapPanel = read("js/core/map-panel.js");
const campaignApp = read("js/campaign-app.js");
const registry = read("js/core/entity-registry.js");

if (!images.includes("CatalogueImages") || !images.includes("/api/assets/")) {
  fail("images.js missing file-backed CatalogueImages API");
} else {
  pass("CatalogueImages file-backed module present");
}

if (!images.includes("persistEntryImages") || !images.includes("clearFields")) {
  fail("images.js missing persist/clearFields helpers");
} else {
  pass("persistEntryImages + clearFields");
}

if (!images.includes("indexedDB")) {
  fail("images.js should keep IndexedDB for legacy/offline");
} else {
  pass("IndexedDB legacy path retained");
}

if (!app.includes("compressImageFile")) fail("missing image compression");
else pass("compresses images before save");

if (!app.includes("CatalogueImages.persistEntryImages")) {
  fail("app does not persist images via CatalogueImages");
} else {
  pass("upload/save uses CatalogueImages.persistEntryImages");
}

if (!app.includes("CatalogueStore.upsert(type, toStore)")) {
  fail("upload path may not upsert after image persist");
} else {
  pass("upserts entry after asset persist");
}

if (!app.includes("imageCache")) fail("missing image cache");
else pass("keeps image cache outside HTML attributes");

if (!app.includes("Processing image")) fail("missing upload progress status");
else pass("shows processing status");

if (!store.includes("QuotaExceededError") && !store.includes("quota")) {
  fail("store missing quota handling");
} else {
  pass("store reports quota failures");
}

if (
  app.includes("renderEditor(activeId);\n            const newForm") ||
  app.includes("renderEditor(activeId);\r\n            const newForm")
) {
  fail("old broken upload pattern still present");
} else {
  pass("old wipe-on-rerender upload pattern removed");
}

if (!mapPanel.includes('CatalogueImages.hydrateAll("location"')) {
  fail("map-panel does not hydrate location map images");
} else {
  pass("map-panel hydrates location images");
}

if (!campaignApp.includes("CatalogueImages.preload") || !campaignApp.includes("migrateAll")) {
  fail("campaign-app missing image preload/migrate");
} else {
  pass("campaign-app preloads/migrates images");
}

if (!registry.includes("CatalogueImages.hydrateAll")) {
  fail("entity-registry does not hydrate catalogue images");
} else {
  pass("entity-registry hydrates portraits");
}

const pages = [
  "dm/compendium/index.html",
  "campaigns/stormwreck-isle/index.html"
];

pages.forEach((rel) => {
  const html = read(rel);
  if (!html.includes("catalogue/images.js")) fail(`${rel} missing images.js script`);
  else pass(`${rel} loads images.js`);
});

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll catalogue image checks passed.");
