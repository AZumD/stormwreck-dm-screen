"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function manifest(rel) {
  const value = require(path.join(root, rel));
  assert.ok(Array.isArray(value), `${rel} exports a seed manifest`);
  return value.map((row) => row.entry).filter(Boolean);
}

const monsters = [
  "js/catalogue-seeds/compendium-bestiary.js",
  "js/catalogue-seeds/compendium-bestiary-ii.js",
  "js/catalogue-seeds/compendium-bestiary-fauna.js",
  "js/catalogue-seeds/compendium-bestiary-npcs.js"
].flatMap(manifest);

const items = [
  "js/catalogue-seeds/compendium-items.js",
  "js/catalogue-seeds/compendium-items-ii.js",
  "js/catalogue-seeds/compendium-items-loot.js"
].flatMap(manifest);

const records = new Map();
const contentApi = {
  getRecord(type, id) {
    return records.get(`${type}:${id}`) || null;
  },
  register(type, entries) {
    Object.entries(entries || {}).forEach(([id, record]) => {
      records.set(`${type}:${id}`, record);
    });
  }
};

// Prove the fallback respects a hand-edited/curated Swedish field.
records.set("monster:monster-wolf", {
  aliases: ["varg"],
  sv: { traits: "KURATERAD VARGTEXT" }
});
records.set("monster:monster-baboon", {
  aliases: ["babian"],
  sv: {}
});

const sandbox = {
  window: {
    CatalogueSeeds: { monster: monsters, item: items },
    CatalogueContentI18n: contentApi
  }
};
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(root, "js/i18n/catalogue-content-sv-monsters-items.js"), "utf8"),
  sandbox
);

assert.ok(monsters.length >= 60, "bestiary growth contains a meaningful monster set");
assert.ok(items.length >= 100, "item growth contains a meaningful equipment/loot set");

for (const entry of monsters) {
  const record = records.get(`monster:${entry.id}`);
  assert.ok(record, `Swedish record exists for monster ${entry.id}`);
  assert.ok(String(record.sv?.name || "").trim(), `Swedish display name exists for monster ${entry.id}`);
  for (const field of ["traits", "actions", "bonusActions", "reactions", "legendaryActions", "notes"]) {
    if (!String(entry[field] || "").trim()) continue;
    assert.ok(String(record.sv?.[field] || "").trim(), `Swedish ${field} exists for monster ${entry.id}`);
  }
}

for (const entry of items) {
  const record = records.get(`item:${entry.id}`);
  assert.ok(record, `Swedish record exists for item ${entry.id}`);
  assert.ok(String(record.sv?.name || "").trim(), `Swedish display name exists for item ${entry.id}`);
  for (const field of ["description", "properties", "notes"]) {
    if (!String(entry[field] || "").trim()) continue;
    assert.ok(String(record.sv?.[field] || "").trim(), `Swedish ${field} exists for item ${entry.id}`);
  }
}

assert.strictEqual(records.get("monster:monster-wolf").sv.name, "Varg", "Wolf is localized as Varg");
assert.strictEqual(records.get("monster:monster-wolf").sv.traits, "KURATERAD VARGTEXT", "curated Swedish overrides fallback prose");
assert.strictEqual(records.get("monster:monster-baboon").sv.name, "Babian", "existing Swedish aliases can supply display names");
assert.strictEqual(records.get("monster:monster-commoner").sv.name, "Vanlig person", "NPC statblocks are localized too");
assert.strictEqual(records.get("item:item-srd-dagger").sv.name, "Dolk", "core weapon names are localized");
assert.strictEqual(records.get("item:item-srd-backpack").sv.name, "Ryggsäck", "adventuring gear names are localized");
assert.ok(records.get("item:item-srd-trade-wheat").sv.name.startsWith("Vete"), "trade goods are localized");
assert.strictEqual(records.get("item:item-srd-bag-of-holding").sv.name, "Bottenlös väska", "magic items receive Swedish display names");

const html = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
const fallback = "catalogue-content-sv-monsters-items.js";
assert.ok(html.includes(fallback), "Compendium loads Swedish monster/item content fallback");
assert.ok(html.indexOf(fallback) < html.indexOf("catalogue-content-sv-editorial.js"), "curated editorial pass loads after fallback");
assert.ok(html.indexOf(fallback) < html.indexOf("CompendiumApp.init"), "fallback loads before first Compendium render");

console.log(`Swedish monster/item coverage passed: ${monsters.length} monsters, ${items.length} items`);
