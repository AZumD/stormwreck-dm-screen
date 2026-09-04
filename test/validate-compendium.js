/**
 * Unified Compendium validation.
 * Run: node test/validate-compendium.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const types = ["pc", "npc", "item", "monster", "location", "race", "background", "class", "spell", "skill", "feature", "music", "source"];
const folders = {
  pc: "pc-katalog",
  npc: "npc-katalog",
  item: "item-katalog",
  monster: "monster-katalog",
  location: "location-katalog",
  race: "race-katalog",
  background: "background-katalog",
  class: "class-katalog",
  spell: "spell-katalog",
  skill: "skill-katalog",
  feature: "feature-katalog",
  music: "music-katalog",
  source: "source-katalog"
};

const compendiumHtml = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
const compendiumJs = fs.readFileSync(path.join(root, "js/core/catalogue/compendium.js"), "utf8");
const backgroundExtension = fs.readFileSync(
  path.join(root, "js/core/catalogue/background-extension.js"),
  "utf8"
);
const featureExtension = fs.readFileSync(path.join(root, "js/core/catalogue/feature-extension.js"), "utf8");
const gardenSeed = fs.readFileSync(path.join(root, "js/catalogue-seeds/compendium-garden.js"), "utf8");
const speciesExpansion = require("../js/catalogue-seeds/compendium-species-expansion");
const bestiaryExpansion = require("../js/catalogue-seeds/compendium-bestiary");
const openContentDoc = fs.readFileSync(path.join(root, "docs/OPEN-CONTENT.md"), "utf8");
const catalogueTypesJs = fs.readFileSync(path.join(root, "js/core/catalogue/types.js"), "utf8");
const legacyJs = fs.readFileSync(path.join(root, "js/core/catalogue/legacy-redirect.js"), "utf8");
const appJs = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const landing = fs.readFileSync(path.join(root, "dm/index.html"), "utf8");
const compendiumCss = fs.readFileSync(path.join(root, "css/compendium.css"), "utf8");

if (!fs.existsSync(path.join(root, "dm/compendium/index.html"))) {
  fail("missing dm/compendium/index.html");
} else {
  pass("compendium route exists");
}

if (
  !compendiumHtml.includes('id="compendium-nav"') ||
  !compendiumHtml.includes('id="cat-list"') ||
  !compendiumHtml.includes("CompendiumApp.init")
) {
  fail("compendium shell incomplete");
} else {
  pass("compendium shell markup");
}

const hostCount = (compendiumHtml.match(/id="cat-editor"/g) || []).length;
if (hostCount !== 1) fail(`expected one cat-editor host, found ${hostCount}`);
else pass("single catalogue host");

if (!compendiumHtml.includes("catalogue/app.js") || !compendiumHtml.includes("compendium.js")) {
  fail("compendium missing CatalogueApp / CompendiumApp scripts");
} else {
  pass("compendium loads shared catalogue modules");
}

if (!compendiumHtml.includes("music-ui.js") || !compendiumHtml.includes("source-ui.js")) {
  fail("compendium missing music/source adapters");
} else {
  pass("compendium loads music + source adapters");
}

if (!compendiumHtml.includes("background-extension.js")) {
  fail("compendium missing Background catalogue extension");
} else {
  pass("compendium loads Background catalogue extension");
}

if (
  !backgroundExtension.includes('type: "background"') ||
  !backgroundExtension.includes("originFeatRefs") ||
  !backgroundExtension.includes('refType: "feature"') ||
  !backgroundExtension.includes("LABELS.background")
) {
  fail("Background catalogue extension incomplete");
} else {
  pass("Background catalogue config + navigation");
}

if (
  !backgroundExtension.includes('id: "rulesets"') ||
  !backgroundExtension.includes('id: "abilityScoreOptions"') ||
  (backgroundExtension.match(/type: "list"/g) || []).length < 3 ||
  !backgroundExtension.includes("rulesets: []") ||
  !backgroundExtension.includes("abilityScoreOptions: []")
) {
  fail("Background array fields should use list editors/defaults");
} else {
  pass("Background array fields use list editors");
}

if (!catalogueTypesJs.includes('id: "background"')) {
  fail("catalogue types missing background entity type");
} else {
  pass("Background registered as a linkable entity type");
}

if (!compendiumHtml.includes("feature-extension.js")) {
  fail("Compendium missing Feature taxonomy extension");
} else {
  pass("Compendium loads Feature taxonomy extension");
}

if (
  !featureExtension.includes('"Origin Feat"') ||
  !featureExtension.includes("groupOrder") ||
  !featureExtension.includes('field.id === "featureType"')
) {
  fail("Feature taxonomy extension incomplete");
} else {
  pass("Feature taxonomy includes Origin Feat and intentional group order");
}

if (!compendiumHtml.includes("compendium-garden.js")) {
  fail("Compendium missing reusable Feature garden seed");
} else {
  pass("Compendium loads reusable Feature garden seed");
}

for (const id of ["feature-rage", "feature-extra-attack", "feature-breath-weapon", "feature-relentless-endurance"]) {
  if (!gardenSeed.includes(`id: "${id}"`)) fail(`Compendium garden missing ${id}`);
  else pass(`Compendium garden ${id}`);
}

const gardenIdCount = (gardenSeed.match(/\bid: "feature-/g) || []).length;
if (gardenIdCount < 20) fail(`expected at least 20 garden Feature seeds, found ${gardenIdCount}`);
else pass(`Compendium garden has ${gardenIdCount} reusable Feature seeds`);

for (const script of [
  "compendium-species-expansion.js",
  "compendium-bestiary.js",
  "catalogue-content-sv-expansion.js"
]) {
  if (!compendiumHtml.includes(script)) fail(`Compendium missing ${script}`);
  else if (compendiumHtml.indexOf(script) > compendiumHtml.indexOf("CompendiumApp.init")) {
    fail(`${script} should load before CompendiumApp.init`);
  } else {
    pass(`Compendium loads ${script} before first render`);
  }
}

if (speciesExpansion.length !== 18) {
  fail(`expected 18 expanded species/lineage seeds, found ${speciesExpansion.length}`);
} else {
  pass("Compendium species expansion has 18 entries");
}
if (!speciesExpansion.some((seed) => seed.id === "race-grung")) fail("species expansion missing Grung");
else pass("species expansion includes Grung");
if (!speciesExpansion.some((seed) => seed.id === "subspecies-genasi-air")) fail("species expansion missing Air Genasi lineage");
else pass("species expansion includes elemental Genasi lineages");
if (!speciesExpansion.some((seed) => seed.id === "subspecies-tiefling-infernal")) fail("species expansion missing Infernal Tiefling lineage");
else pass("species expansion includes 2024 Tiefling legacies");
if (!speciesExpansion.every((seed) => seed.type === "race" && seed.entry?.id === seed.id)) {
  fail("species expansion contains malformed catalogue manifest entries");
} else {
  pass("species expansion manifest shape");
}

if (bestiaryExpansion.length !== 33) {
  fail(`expected 33 generic bestiary seeds, found ${bestiaryExpansion.length}`);
} else {
  pass("generic SRD bestiary has 33 entries");
}
if (!bestiaryExpansion.some((seed) => seed.id === "monster-goblin")) fail("bestiary missing Goblin");
else pass("generic bestiary includes Goblin");
if (!bestiaryExpansion.some((seed) => seed.id === "monster-owlbear")) fail("bestiary missing Owlbear");
else pass("generic bestiary includes Owlbear");
for (const color of ["black", "white", "green", "blue", "red"]) {
  const id = `monster-young-${color}-dragon`;
  if (!bestiaryExpansion.some((seed) => seed.id === id)) fail(`bestiary missing ${id}`);
  else pass(`generic bestiary ${id}`);
}
const bestiaryIds = bestiaryExpansion.map((seed) => seed.id);
if (new Set(bestiaryIds).size !== bestiaryIds.length) fail("generic bestiary contains duplicate ids");
else pass("generic bestiary ids are unique");
if (!bestiaryExpansion.every((seed) => seed.type === "monster" && seed.entry?.source === "SRD 5.1 (CC BY 4.0)")) {
  fail("generic bestiary should preserve SRD 5.1 CC BY provenance on every entry");
} else {
  pass("generic bestiary entries preserve SRD 5.1 CC BY provenance");
}

if (!openContentDoc.includes("System Reference Document 5.1") || !openContentDoc.includes("CC BY 4.0")) {
  fail("open-content attribution doc missing SRD 5.1 / CC BY 4.0 credit");
} else {
  pass("open-content attribution documented");
}

["open", "dispose", "setType", "getCurrentType", "flushPendingSave", "mountCatalogue"].forEach((sym) => {
  if (!appJs.includes(sym)) fail(`CatalogueApp missing ${sym}`);
  else pass(`CatalogueApp.${sym}`);
});

if (!appJs.includes("AbortController")) fail("CatalogueApp lifecycle should use AbortController");
else pass("CatalogueApp AbortController dispose");

if (!legacyJs.includes("compendium") || !legacyJs.includes("data-type")) {
  fail("legacy-redirect.js incomplete");
} else {
  pass("legacy redirect helper");
}

for (const type of types) {
  const folder = folders[type];
  const html = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  if (!html.includes("legacy-redirect.js") || !html.includes(`data-type="${type}"`)) {
    fail(`${folder} missing legacy redirect for ${type}`);
  } else {
    pass(`${folder} legacy redirect`);
  }
  if (html.includes("CatalogueApp.init")) fail(`${folder} still mounts standalone CatalogueApp`);
}

if (!landing.includes('href="compendium/"') || !landing.includes("Compendium")) {
  fail("DM Library missing primary Compendium link");
} else {
  pass("DM Library Compendium link");
}

if (landing.includes("NPC Catalogue") || landing.includes("Monster Catalogue")) {
  fail("DM Library still lists individual catalogue destinations");
} else {
  pass("DM Library catalogue grid removed");
}

types.filter((t) => t !== "background").forEach((t) => {
  if (!compendiumJs.includes(`"${t}"`)) fail(`compendium nav missing type ${t}`);
  else pass(`compendium type ${t}`);
});
if (!backgroundExtension.includes('"background"')) fail("Background extension should inject background into Compendium navigation");
else pass("Background extension injects Compendium navigation type");

if (!compendiumJs.includes("history.pushState") || !compendiumJs.includes("popstate")) {
  fail("compendium missing URL history sync");
} else {
  pass("compendium URL/history");
}

if (!compendiumJs.includes("config?.subtitle")) fail("compendium should sync subtitle on type change");
else pass("compendium subtitle sync");

if (!compendiumHtml.includes("catalogue.css") || compendiumHtml.includes("css/style.css")) {
  fail("compendium should load catalogue.css only once (no duplicate style.css link)");
} else pass("compendium stylesheet wiring");

if (!compendiumCss.includes("z-index: 1") || !compendiumCss.includes(".compendium-page .catalogue-sidebar")) {
  fail("compendium.css missing stacking / opaque catalogue panels");
} else pass("compendium panel stacking");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll compendium checks passed.");
