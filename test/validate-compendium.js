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

const compendiumHtml = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
const compendiumJs = fs.readFileSync(path.join(root, "js/core/catalogue/compendium.js"), "utf8");
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

types.forEach((t) => {
  if (!compendiumJs.includes(`"${t}"`)) fail(`compendium nav missing type ${t}`);
  else pass(`compendium type ${t}`);
});

if (!compendiumJs.includes("history.pushState") || !compendiumJs.includes("popstate")) {
  fail("compendium missing URL history sync");
} else {
  pass("compendium URL/history");
}

if (!compendiumJs.includes("compendiumLastType")) fail("compendium missing last-type persistence hint");
else pass("compendium last-type key");

if (!compendiumCss.includes("compendium-nav__link.is-active") || !compendiumCss.includes("@media (max-width: 900px)")) {
  fail("compendium.css missing active state or responsive rail");
} else {
  pass("compendium styles");
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll compendium checks passed.");
