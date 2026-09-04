"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const editorial = read("js/i18n/catalogue-content-sv-editorial.js");
const characterEditorial = read("js/i18n/catalogue-content-sv-editorial-character.js");
const combinedEditorial = `${editorial}\n${characterEditorial}`;
const html = read("dm/compendium/index.html");

assert.doesNotThrow(() => new vm.Script(editorial, { filename: "catalogue-content-sv-editorial.js" }), "Swedish editorial pack parses");
assert.doesNotThrow(() => new vm.Script(characterEditorial, { filename: "catalogue-content-sv-editorial-character.js" }), "Swedish character editorial pack parses");
assert.ok(html.includes("catalogue-content-sv-editorial.js"), "Compendium loads Swedish editorial pack");
assert.ok(html.includes("catalogue-content-sv-editorial-character.js"), "Compendium loads Swedish character editorial pack");
assert.ok(html.indexOf("catalogue-content-sv-editorial.js") > html.indexOf("catalogue-content-sv-stormwreck.js"), "editorial pack loads after base Swedish content");
assert.ok(html.indexOf("catalogue-content-sv-editorial-character.js") > html.indexOf("catalogue-content-sv-editorial.js"), "character editorial pack loads after the general editorial pass");
assert.ok(html.indexOf("catalogue-content-sv-editorial-character.js") < html.indexOf("CompendiumApp.init"), "editorial packs load before first Compendium render");

const records = new Map();
function key(type, id) { return `${type}:${id}`; }
const sandbox = {
  window: {
    CatalogueContentI18n: {
      getRecord(type, id) {
        return records.get(key(type, id)) || null;
      },
      register(type, entries) {
        Object.entries(entries || {}).forEach(([id, record]) => {
          records.set(key(type, id), JSON.parse(JSON.stringify(record)));
        });
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(editorial, sandbox, { filename: "catalogue-content-sv-editorial.js" });
vm.runInContext(characterEditorial, sandbox, { filename: "catalogue-content-sv-editorial-character.js" });

const byType = {};
for (const [compound, record] of records.entries()) {
  const type = compound.split(":", 1)[0];
  byType[type] = (byType[type] || 0) + 1;
  assert.ok(record.sv && Object.keys(record.sv).length, `${compound} has Swedish editorial fields`);
}

assert.ok((byType.rule || 0) >= 30, "editorial pass covers the high-use rules catalogue");
assert.ok((byType.feature || 0) >= 30, "editorial pass covers garden and high-use core features");
assert.ok((byType.race || 0) >= 20, "editorial pass covers expansion species plus awkward core species copy");
assert.ok((byType.class || 0) >= 13, "editorial pass covers every core class plus Artificer");
assert.ok((byType.background || 0) >= 10, "editorial pass covers the backgrounds that most needed prose cleanup");
assert.ok((byType.spell || 0) >= 30, "editorial pass covers the most common low-level spells");
assert.ok((byType.npc || 0) >= 4, "editorial pass covers key Stormwreck NPC prose");
assert.ok((byType.monster || 0) >= 2, "editorial pass covers key Stormwreck monster prose");

const constitution = records.get("rule:rule-constitution")?.sv || {};
assert.ok(constitution.quickReference.includes("Constitution-save"), "Constitution copy uses natural table language");
assert.ok(!constitution.quickReference.includes("Fysik/Constitution-räddningsslag"), "Constitution copy drops machine-like compound translation");

const initiative = records.get("rule:rule-initiative")?.sv || {};
assert.ok(initiative.quickReference.includes("excelark"), "editorial voice survives in non-mechanical rule guidance");

const mageHand = records.get("spell:spell-mage-hand")?.sv || {};
assert.ok(mageHand.summary.includes("utan att gå hela vägen dit själv"), "spell prose is idiomatic rather than literal");

const cunning = records.get("feature:feature-cunning-action")?.sv || {};
assert.ok(!cunning.summary.includes("signifikant rogue-rörlighet"), "feature copy removes translationese");

const airGenasi = records.get("race:subspecies-genasi-air")?.sv || {};
assert.ok(!airGenasi.traits.includes("ovanlig bekvämlighet"), "species copy removes literal calques");

const paladin = records.get("class:class-paladin")?.sv || {};
assert.ok(paladin.summary.includes("Smite"), "Paladin copy keeps the table term instead of inventing a Swedish verb");
assert.ok(!paladin.summary.includes("smita fiender"), "Paladin copy removes the false-friend smita translation");

const outlander = records.get("background:background-outlander")?.sv || {};
assert.ok(outlander.description.includes("vildmarken"), "Outlander prose now reads like idiomatic Swedish");

const wildShape = records.get("feature:feature-wild-shape")?.sv || {};
assert.ok(wildShape.summary.includes("beast"), "Wild Shape keeps the familiar D&D table term where it reads better");

for (const banned of [
  "ranged spell attack",
  "melee spell attack",
  "under det angivna tidsfönstret",
  "signifikant rogue-rörlighet",
  "nivåskalad bonus",
  "ovanlig bekvämlighet",
  "smita fiender",
  "professionellt nätverk"
]) {
  assert.ok(!combinedEditorial.includes(banned), `editorial packs do not contain machine-like phrase: ${banned}`);
}

console.log(`Swedish editorial validation passed (${Object.entries(byType).map(([type, count]) => `${type}:${count}`).join(", ")})`);
