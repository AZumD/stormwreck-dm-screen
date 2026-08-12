/**
 * Validates catalogue pages, configs, and storage keys.
 * Run: node test/validate-catalogues.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const types = ["pc", "npc", "item", "monster", "location"];
const folders = {
  pc: "pc-katalog",
  npc: "npc-katalog",
  item: "item-katalog",
  monster: "monster-katalog",
  location: "location-katalog"
};

let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

const configsCode = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const appCode = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const storeCode = fs.readFileSync(path.join(root, "js/core/catalogue/store.js"), "utf8");
const landing = fs.readFileSync(path.join(root, "index.html"), "utf8");

const seedsCode = fs.readFileSync(path.join(root, "js/catalogue-seeds/stormwreck-isle.js"), "utf8");

for (const type of types) {
  const folder = folders[type];
  const htmlPath = path.join(root, folder, "index.html");
  if (!fs.existsSync(htmlPath)) {
    fail(`Missing ${folder}/index.html`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes(`CatalogueApp.init("${type}")`)) fail(`${folder} missing init("${type}")`);
  else pass(`${folder} init call`);

  if (!html.includes("catalogue/store.js")) fail(`${folder} missing store.js`);
  if (!html.includes("catalogue.css")) fail(`${folder} missing catalogue.css`);

  if (!configsCode.includes(`${type}:`)) fail(`configs.js missing ${type} config`);
  else pass(`config for ${type}`);
}

if (!storeCode.includes("catalogue-${type}") && !storeCode.includes("`catalogue-${type}`"))
  fail("store.js missing dynamic key pattern");
else pass("store key pattern");

if (!appCode.includes("CatalogueStore")) fail("app.js missing store usage");
else pass("app.js uses CatalogueStore");

if (!landing.includes("pc-katalog") || !landing.includes("location-katalog"))
  fail("landing page missing catalogue links");
else pass("landing page links to catalogues");

if (!fs.existsSync(path.join(root, "css/catalogue.css"))) fail("catalogue.css missing");
else pass("catalogue.css exists");

if (!storeCode.includes("mergeSeeds")) fail("store.js missing mergeSeeds");
else pass("store mergeSeeds");

if (!seedsCode.includes("CatalogueSeeds")) fail("stormwreck seeds missing");
else pass("stormwreck seed file");

if (!seedsCode.includes("sw-runara") || !seedsCode.includes("sw-sparkrender"))
  fail("seeds missing key Stormwreck entries");
else pass("stormwreck NPC/monster seeds present");

if (!seedsCode.includes("sw-moonstone-key") || !seedsCode.includes("sw-dragons-rest"))
  fail("seeds missing item/location entries");
else pass("stormwreck item/location seeds present");

if (!appCode.includes("mergeSeeds")) fail("app.js missing seed merge on init");
else pass("app merges seeds on init");

const npcHtml = fs.readFileSync(path.join(root, "npc-katalog/index.html"), "utf8");
const itemHtml = fs.readFileSync(path.join(root, "item-katalog/index.html"), "utf8");
if (!npcHtml.includes("stormwreck-isle.js")) fail("npc-katalog missing seed script");
else pass("npc-katalog loads seeds");
if (!itemHtml.includes("stormwreck-isle.js")) fail("item-katalog missing seed script");
else pass("item-katalog loads seeds");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll catalogue checks passed.");
