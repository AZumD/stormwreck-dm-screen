/**
 * Validates catalogue pages, configs, and storage keys.
 * Run: node test/validate-catalogues.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const types = ["pc", "npc", "item", "monster", "location", "race", "class", "spell", "skill", "feature", "music", "source"];
const folders = {
  pc: "pc-katalog",
  npc: "npc-katalog",
  item: "item-katalog",
  monster: "monster-katalog",
  location: "location-katalog",
  race: "race-katalog",
  class: "class-katalog",
  spell: "spell-katalog",
  skill: "skill-katalog",
  feature: "feature-katalog",
  music: "music-katalog",
  source: "source-katalog"
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
const landing = fs.readFileSync(path.join(root, "dm/index.html"), "utf8");

const seedsCode = fs.readFileSync(path.join(root, "js/catalogue-seeds/stormwreck-isle.js"), "utf8");

for (const type of types) {
  const folder = folders[type];
  const htmlPath = path.join(root, folder, "index.html");
  if (!fs.existsSync(htmlPath)) {
    fail(`Missing ${folder}/index.html`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes("legacy-redirect.js") || !html.includes(`data-type="${type}"`)) {
    fail(`${folder} missing legacy redirect to compendium`);
  } else {
    pass(`${folder} legacy redirect`);
  }

  if (!configsCode.includes(`${type}:`)) fail(`configs.js missing ${type} config`);
  else pass(`config for ${type}`);
}

const compendiumHtml = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
if (!compendiumHtml.includes("CompendiumApp.init") || !compendiumHtml.includes('id="cat-list"')) {
  fail("dm/compendium/index.html incomplete");
} else {
  pass("unified compendium page");
}
if (!compendiumHtml.includes("stormwreck-isle.js") || !compendiumHtml.includes("core-rules.js")) {
  fail("compendium missing seed scripts");
} else {
  pass("compendium loads catalogue seeds");
}

if (!storeCode.includes("catalogue-${type}") && !storeCode.includes("`catalogue-${type}`"))
  fail("store.js missing dynamic key pattern");
else pass("store key pattern");

if (!appCode.includes("CatalogueStore")) fail("app.js missing store usage");
else pass("app.js uses CatalogueStore");

if (!appCode.includes("renderWikiView") || !appCode.includes('data-action="edit"')) {
  fail("app.js missing wiki read view");
} else {
  pass("app.js wiki read view");
}

if (!landing.includes("compendium/") || !landing.includes("Compendium")) {
  fail("landing page missing Compendium link");
} else {
  pass("landing page links to Compendium");
}

if (landing.includes("landing-sidebar")) fail("landing should not restore the retired catalogue sidebar");
else pass("legacy catalogue sidebar remains removed");

if (!fs.existsSync(path.join(root, "css/catalogue.css"))) fail("catalogue.css missing");
else pass("catalogue.css exists");

if (!storeCode.includes("mergeSeeds")) fail("store.js missing mergeSeeds");
else pass("store mergeSeeds");

if (!seedsCode.includes("CatalogueSeeds")) fail("stormwreck seeds missing");
else pass("stormwreck seed file");

const coreSeeds = fs.readFileSync(path.join(root, "js/catalogue-seeds/core-rules.js"), "utf8");
if (!coreSeeds.includes("CatalogueSeeds.race") || !coreSeeds.includes("CatalogueSeeds.class")) {
  fail("core-rules seeds missing race/class");
} else {
  pass("core-rules race/class seeds");
}
["race-dwarf", "race-human", "class-fighter", "class-wizard"].forEach((id) => {
  if (!coreSeeds.includes(id)) fail(`core-rules missing ${id}`);
  else pass(`seed ${id}`);
});

const raceHtml = fs.readFileSync(path.join(root, "race-katalog/index.html"), "utf8");
const classHtml = fs.readFileSync(path.join(root, "class-katalog/index.html"), "utf8");
if (!compendiumHtml.includes("core-rules.js")) fail("compendium missing core-rules seeds");
else pass("compendium loads core-rules");

const spellSeeds = fs.readFileSync(path.join(root, "js/catalogue-seeds/core-spells.js"), "utf8");
const spellHtml = compendiumHtml;
if (!spellSeeds.includes("CatalogueSeeds.spell") || !spellSeeds.includes("spell-fireball")) {
  fail("core-spells seeds incomplete");
} else {
  pass("core-spells seed file");
}
if (!compendiumHtml.includes("core-spells.js")) fail("compendium missing core-spells");
else pass("compendium loads core-spells");

const skillSeeds = fs.readFileSync(path.join(root, "js/catalogue-seeds/core-skills.js"), "utf8");
const featureSeeds = fs.readFileSync(path.join(root, "js/catalogue-seeds/core-features.js"), "utf8");
const skillHtml = compendiumHtml;
const featureHtml = compendiumHtml;
if (!skillSeeds.includes("CatalogueSeeds.skill") || !skillSeeds.includes("skill-nature")) {
  fail("core-skills seeds incomplete");
} else {
  pass("core-skills seed file");
}
if (!featureSeeds.includes("CatalogueSeeds.feature") || !featureSeeds.includes("feature-wild-shape")) {
  fail("core-features seeds incomplete");
} else {
  pass("core-features seed file");
}
if (!compendiumHtml.includes("core-skills.js")) fail("compendium missing core-skills");
else pass("compendium loads core-skills");
if (!compendiumHtml.includes("core-features.js")) fail("compendium missing core-features");
else pass("compendium loads core-features");

if (!coreSeeds.includes("featureRefs") || !coreSeeds.includes("@feature:wild-shape")) {
  fail("core-rules missing feature references on classes/races");
} else {
  pass("core-rules references features");
}
if (!coreSeeds.includes("skillRefs") || !coreSeeds.includes("@skill:nature")) {
  fail("core-rules missing skill references on classes");
} else {
  pass("core-rules references skills");
}

const typesJs = fs.readFileSync(path.join(root, "js/core/catalogue/types.js"), "utf8");
if (!typesJs.includes("CatalogueTypes") || !typesJs.includes("linkAlternation")) {
  fail("catalogue types registry missing");
} else {
  pass("CatalogueTypes declarative registry");
}

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
if (!compendiumHtml.includes("stormwreck-isle.js")) fail("compendium missing stormwreck seeds");
else pass("compendium loads stormwreck seeds");
if (!npcHtml.includes("legacy-redirect.js")) fail("npc-katalog should redirect to compendium");
else pass("npc-katalog legacy redirect");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll catalogue checks passed.");
