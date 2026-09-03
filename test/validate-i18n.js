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

for (const key of Object.keys(english)) {
  assert.ok(Object.prototype.hasOwnProperty.call(swedish, key), `Swedish dictionary covers existing top-level key: ${key}`);
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

const typesCode = read("js/core/catalogue/types.js");
for (const file of ["en.js", "sv.js", "language.js", "dom-localization.js"]) {
  assert.ok(typesCode.includes(file), `shared catalogue bootstrap loads ${file}`);
}
assert.ok(typesCode.includes("document.write"), "parser-time bootstrap selects language before downstream campaign modules initialize");

const creatorGate = read("js/character-creator-gate.js");
for (const file of ["en.js", "sv.js", "sv-creator.js", "language.js", "dom-localization.js"]) {
  assert.ok(creatorGate.includes(file), `Character Creator language bootstrap loads ${file}`);
}

const domCode = read("js/i18n/dom-localization.js");
assert.ok(domCode.includes("StormwreckDomLocalization"), "DOM localization marks itself installed");
assert.ok(domCode.includes("if (el.textContent !== value)"), "DOM localization avoids text mutation feedback loops");
assert.ok(domCode.includes("if (el.getAttribute(name) !== value)"), "DOM localization avoids attribute mutation churn");

const catalogueCode = read("js/i18n/catalogue-localization.js");
assert.ok(catalogueCode.includes("Regelkatalog"), "Compendium has Swedish Rules catalogue copy");
assert.ok(catalogueCode.includes("Färdighetskatalog"), "Compendium has Swedish Skills catalogue copy");
assert.ok(catalogueCode.includes("Rustningsklass (AC)"), "catalogue editor uses Swedish Armor Class terminology");

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
assert.ok(compendiumHtml.includes("catalogue-localization.js"), "Compendium loads catalogue-specific localization before init");
assert.ok(
  compendiumHtml.indexOf("catalogue-localization.js") < compendiumHtml.indexOf("CompendiumApp.init"),
  "Compendium localization runs before first render"
);

const languageCss = read("css/language.css");
assert.ok(languageCss.includes(".site-language-switcher"), "language switcher has global styling");

const terminologyDoc = read("docs/I18N.md");
for (const term of ["rollperson", "färdighet", "grundegenskap", "rustningsklass (AC)", "spell slot"]) {
  assert.ok(terminologyDoc.includes(term), `terminology contract documents ${term}`);
}
assert.ok(terminologyDoc.includes("freeleaguepublishing.com"), "terminology contract records Swedish RPG source material");

console.log("sitewide Swedish/English i18n validation passed");
