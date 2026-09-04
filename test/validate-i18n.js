"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read("js/i18n/en.js"), sandbox);
const english = sandbox.window.I18N;
vm.runInContext(read("js/i18n/sv.js"), sandbox);
vm.runInContext(read("js/i18n/sv-creator.js"), sandbox);
const swedish = sandbox.window.I18N_SV;

assert.ok(english && typeof english === "object", "English dictionary loads");
assert.ok(swedish && typeof swedish === "object", "Swedish dictionary loads");

for (const key of [
  "readAloud",
  "dmNote",
  "searchNoResults",
  "commandPalettePlaceholder",
  "referenceTitle",
  "currentSceneButton",
  "showMap",
  "partyHeading",
  "musicHeading",
  "sceneLocation",
  "chronicleIntro"
]) {
  assert.ok(Object.prototype.hasOwnProperty.call(swedish, key), `Swedish dictionary covers core campaign key: ${key}`);
}

assert.strictEqual(swedish.typeLabels.pc, "Rollperson", "PC uses established Swedish rollperson");
assert.strictEqual(swedish.typeLabels.skill, "Färdighet", "Skill uses established Swedish färdighet");
assert.strictEqual(swedish.typeLabels.race, "Släkte", "Species uses Swedish släkte in UI");
assert.strictEqual(swedish.site.terms.abilityScore, "grundegenskap", "ability score uses grundegenskap");
assert.strictEqual(swedish.site.terms.armorClass, "rustningsklass (AC)", "Armor Class keeps AC with Swedish noun");
assert.strictEqual(swedish.site.terms.shortRest, "kort vila", "short rest is translated naturally");
assert.strictEqual(swedish.site.terms.longRest, "lång vila", "long rest is translated naturally");
assert.strictEqual(swedish.site.terms.spellSlot, "spell slot", "spell slot is intentionally retained until terminology is settled");
assert.strictEqual(swedish.site.terms.cantrip, "cantrip", "cantrip is intentionally retained");
assert.strictEqual(swedish.site.terms.proficiency, "proficiency", "proficiency is intentionally retained");
assert.strictEqual(swedish.site.terms.feat, "feat", "feat is intentionally retained");
assert.strictEqual(swedish.site.creator.steps.start, "Kom igång", "creator steps have Swedish chrome");
assert.strictEqual(swedish.site.creator.steps.species, "Släkte", "creator Species step uses Swedish vocabulary");
assert.strictEqual(swedish.site.creator.steps.review, "Granska", "creator Review step is localized");

const languageCode = read("js/i18n/language.js");
assert.ok(languageCode.includes('const STORAGE_KEY = "stormwreck-language"'), "language preference has a stable storage key");
assert.ok(languageCode.includes('const DEFAULT_LANGUAGE = "sv"'), "Swedish is the default language");
assert.ok(languageCode.includes("location.reload()"), "language switching reloads to keep module state consistent");
assert.ok(languageCode.includes("site-language-switcher"), "runtime renders the global SV/EN switcher");

const localeCode = read("js/i18n/locale.js");
assert.ok(localeCode.includes('return window.AppI18n.language === "sv" ? "sv-SE" : "en-GB"'), "date locale follows selected language");
assert.ok(localeCode.includes("toLocaleDateString"), "date-only formatting is localized");
assert.ok(localeCode.includes("toLocaleTimeString"), "time formatting is localized");
assert.ok(localeCode.includes("toLocaleString"), "date-time formatting is localized");

const typesCode = read("js/core/catalogue/types.js");
for (const file of ["en.js", "sv.js", "language.js", "locale.js", "dom-localization.js"]) {
  assert.ok(typesCode.includes(file), `shared catalogue bootstrap loads ${file}`);
}
assert.ok(typesCode.includes("document.write"), "parser-time bootstrap selects language before downstream campaign modules initialize");
assert.ok(typesCode.includes("player-localization.js"), "Player Companion loads dynamic Swedish chrome localization");

const creatorGate = read("js/character-creator-gate.js");
for (const file of ["en.js", "sv.js", "sv-creator.js", "language.js", "locale.js", "dom-localization.js"]) {
  assert.ok(creatorGate.includes(file), `Character Creator language bootstrap loads ${file}`);
}

const domCode = read("js/i18n/dom-localization.js");
assert.ok(domCode.includes("StormwreckDomLocalization"), "DOM localization marks itself installed");
assert.ok(domCode.includes("if (el.textContent !== value)"), "DOM localization avoids text mutation feedback loops");
assert.ok(domCode.includes("if (el.getAttribute(name) !== value)"), "DOM localization avoids attribute mutation churn");

const playerLocalization = read("js/i18n/player-localization.js");
assert.ok(playerLocalization.includes("No characters yet."), "dynamic Player empty states are localized");
assert.ok(playerLocalization.includes("Färdigheter"), "dynamic Player library uses Swedish skill terminology");
assert.ok(playerLocalization.includes("Nästa spelmöte"), "dynamic scheduling chrome uses Swedish session terminology");
assert.ok(playerLocalization.includes("MutationObserver"), "dynamic Player views are localized after rerender");
assert.ok(playerLocalization.includes("if (el.textContent !== next)"), "Player localization avoids observer feedback loops");

const catalogueCode = read("js/i18n/catalogue-localization.js");
assert.ok(catalogueCode.includes("Regelkatalog"), "Compendium has Swedish Rules catalogue copy");
assert.ok(catalogueCode.includes("Färdighetskatalog"), "Compendium has Swedish Skills catalogue copy");
assert.ok(catalogueCode.includes("Rustningsklass (AC)"), "catalogue editor uses Swedish Armor Class terminology");

const contentEnginePath = "js/i18n/catalogue-content-i18n.js";
const contentPackPaths = [
  "js/i18n/catalogue-content-sv-rules.js",
  "js/i18n/catalogue-content-sv-character.js",
  "js/i18n/catalogue-content-sv-spells.js",
  "js/i18n/catalogue-content-sv-stormwreck.js"
];

for (const file of [contentEnginePath, ...contentPackPaths]) {
  assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), `${file} parses as JavaScript`);
}

const contentEngine = read(contentEnginePath);
assert.ok(contentEngine.includes('Object.defineProperty(entry, "i18n"'), "localized entry overlays are runtime-only properties");
assert.ok(contentEngine.includes("enumerable: false"), "localization metadata is non-enumerable and cannot leak into saved entries");
assert.ok(contentEngine.includes('Object.defineProperty(entry, "searchSv"'), "Swedish content contributes a dedicated search field");
assert.ok(contentEngine.includes("fieldMayLocalize"), "content localization checks canonical fields before replacing display copy");
assert.ok(contentEngine.includes("seedEntry"), "browser seed text is used as the canonical edit-preservation baseline");
assert.ok(contentEngine.includes('.cat-list-item[data-id]'), "localized content updates Compendium list rows");
assert.ok(contentEngine.includes('.cat-wiki[data-entry-id]'), "localized content updates Compendium read view");
assert.ok(!contentEngine.includes('.cat-form[data-entry-id]'), "localized content does not rewrite editor forms");

const registered = {};
const packSandbox = {
  window: {
    CatalogueContentI18n: {
      register(type, entries) {
        registered[type] = { ...(registered[type] || {}), ...(entries || {}) };
      }
    }
  }
};
vm.createContext(packSandbox);
for (const file of contentPackPaths) {
  vm.runInContext(read(file), packSandbox, { filename: file });
}

assert.ok(Object.keys(registered.rule || {}).length >= 45, "all DM-screen rule cheat sheets have Swedish content");
assert.strictEqual(Object.keys(registered.skill || {}).length, 18, "all 18 D&D skills have Swedish content");
assert.ok(Object.keys(registered.background || {}).length >= 38, "expanded Character Creator backgrounds have Swedish content");
assert.ok(Object.keys(registered.race || {}).length >= 55, "core and expanded species have Swedish content");
assert.ok(Object.keys(registered.class || {}).length >= 13, "core classes plus Artificer have Swedish content");
assert.ok(Object.keys(registered.feature || {}).length >= 24, "core features and origin feats have Swedish content");
assert.ok(Object.keys(registered.spell || {}).length >= 85, "core and Character Creator spell entries have Swedish content");
assert.ok(Object.keys(registered.npc || {}).length >= 10, "Stormwreck NPC entries have Swedish content");
assert.ok(Object.keys(registered.monster || {}).length >= 8, "Stormwreck monster entries have Swedish content");
assert.ok(Object.keys(registered.item || {}).length >= 8, "Stormwreck quest/item seed entries have Swedish content");
assert.ok(Object.keys(registered.location || {}).length >= 6, "Stormwreck location entries have Swedish content");

assert.strictEqual(registered.rule["rule-constitution"].sv.name, "Fysik (Constitution)", "Constitution cheat sheet uses Swedish table vocabulary");
assert.strictEqual(registered.skill["skill-stealth"].sv.name, "Smyga", "Stealth localizes to Smyga");
assert.strictEqual(registered.skill["skill-medicine"].sv.name, "Läkekonst", "Medicine localizes to Läkekonst");
assert.strictEqual(registered.skill["skill-sleight-of-hand"].sv.name, "Fingerfärdighet", "Sleight of Hand localizes to Fingerfärdighet");
assert.ok(registered.background["background-outlander"].sv.description.includes("vildmark"), "Outlander has Swedish reference prose");
assert.ok(registered.race["race-elf"].sv.summary.includes("alv") || registered.race["race-elf"].sv.name === "Alv", "Elf has Swedish species copy");
assert.ok(registered.class["class-wizard"].sv.spellcasting.includes("INT"), "Wizard mechanics have Swedish reference prose");
assert.ok(registered.feature["feature-wild-shape"].sv.description.includes("beast"), "Wild Shape has Swedish mechanical prose");
assert.ok(registered.spell["spell-fireball"].sv.description.includes("eld"), "Fireball has Swedish reference prose");
assert.ok(registered.npc["sw-runara"].sv.summary.includes("bronsdrake"), "Runara entry is localized without translating her proper name");
assert.ok(registered.monster["sw-sparkrender"].sv.traits.includes("ritual"), "Sparkrender DM notes are localized");
assert.ok(registered.location["sw-seagrow-caves"].sv.description.includes("Havsgrottor"), "Seagrow Caves description is localized");

const rootHtml = read("index.html");
assert.ok(rootHtml.includes("/js/i18n/language.js"), "root gate loads the language runtime");
assert.ok(rootHtml.includes('data-i18n="site.home.choosePath"'), "root gate copy is dictionary-backed");

for (const entrypoint of [
  "dm/index.html",
  "player/index.html",
  "dm/compendium/index.html",
  "campaigns/stormwreck-isle/index.html",
  "campaigns/sandbox/index.html",
  "campaigns/map-fullscreen/index.html"
]) {
  assert.ok(read(entrypoint).includes("catalogue/types.js"), `${entrypoint} reaches the shared language bootstrap`);
}

const compendiumHtml = read("dm/compendium/index.html");
assert.ok(compendiumHtml.includes("catalogue-localization.js"), "Compendium loads catalogue-specific chrome localization before init");
for (const file of ["catalogue-content-i18n.js", "catalogue-content-sv-rules.js", "catalogue-content-sv-character.js", "catalogue-content-sv-spells.js", "catalogue-content-sv-stormwreck.js"]) {
  assert.ok(compendiumHtml.includes(file), `Compendium loads ${file}`);
  assert.ok(compendiumHtml.indexOf(file) < compendiumHtml.indexOf("CompendiumApp.init"), `${file} loads before first Compendium render`);
}
assert.ok(
  compendiumHtml.indexOf("catalogue-content-i18n.js") < compendiumHtml.indexOf("catalogue-content-sv-rules.js"),
  "content localization engine loads before its data packs"
);

const languageCss = read("css/language.css");
assert.ok(languageCss.includes(".site-language-switcher"), "language switcher has global styling");

const terminologyDoc = read("docs/I18N.md");
for (const term of ["rollperson", "färdighet", "grundegenskap", "rustningsklass (AC)", "spell slot"]) {
  assert.ok(terminologyDoc.includes(term), `terminology contract documents ${term}`);
}
assert.ok(terminologyDoc.includes("freeleaguepublishing.com"), "terminology contract records Swedish RPG source material");

console.log("sitewide Swedish/English i18n validation passed");
