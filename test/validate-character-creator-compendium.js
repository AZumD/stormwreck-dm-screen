"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(root, "js", "character-creator-expanded-data.js"), "utf8"),
  sandbox
);
vm.runInContext(
  fs.readFileSync(path.join(root, "js", "character-creator-compendium-bindings.js"), "utf8"),
  sandbox
);

const creator = sandbox.window.StormwreckCharacterCreatorData;
const bindings = sandbox.window.StormwreckCharacterCreatorCompendium;
const manifest = require(path.join(root, "server", "seeds", "character-creator-compendium.js"));

function catalogueEntries(type) {
  const dir = path.join(root, "data", "catalogues", type);
  const entries = fs.existsSync(dir)
    ? fs.readdirSync(dir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")))
    : [];
  for (const seed of manifest) {
    if (seed.type === type) entries.push(seed.entry);
  }
  return entries;
}

function indexType(type) {
  const byName = new Map();
  const byId = new Map();
  for (const entry of catalogueEntries(type)) {
    if (entry?.name && !byName.has(entry.name)) byName.set(entry.name, entry);
    if (entry?.id && !byId.has(entry.id)) byId.set(entry.id, entry);
  }
  return { byName, byId };
}

const classes = indexType("class");
const races = indexType("race");
const skills = indexType("skill");
const features = indexType("feature");
const spells = indexType("spell");

for (const klass of creator.CLASSES) {
  const entry = classes.byName.get(klass.name);
  assert.ok(entry, `creator class has Compendium entry: ${klass.name}`);
  assert.strictEqual(
    entry.id,
    bindings.catalogueId("class", klass.name),
    `creator class uses canonical Compendium id: ${klass.name}`
  );
}

for (const species of creator.SPECIES) {
  const entry = races.byName.get(species.name);
  assert.ok(entry, `creator species has Compendium race entry: ${species.name}`);
  assert.strictEqual(
    entry.id,
    bindings.catalogueId("race", species.name),
    `creator species uses canonical Compendium id: ${species.name}`
  );
}

for (const feat of creator.FEATS) {
  const entry = features.byName.get(feat);
  assert.ok(entry, `creator feat has Compendium feature entry: ${feat}`);
  assert.strictEqual(entry.id, bindings.featId(feat), `creator feat uses canonical Feature id: ${feat}`);
  assert.match(String(entry.featureType || ""), /feat/i, `${feat} is typed as a feat in the Compendium`);
}

for (const spell of creator.SPELLS) {
  const entry = spells.byName.get(spell);
  assert.ok(entry, `creator spell has Compendium entry: ${spell}`);
  assert.strictEqual(
    entry.id,
    bindings.catalogueId("spell", spell),
    `creator spell uses canonical Compendium id: ${spell}`
  );
}

for (const [className, config] of Object.entries(bindings.CLASS_SKILLS)) {
  assert.ok(classes.byName.has(className), `skill config belongs to a Compendium class: ${className}`);
  const pool = config.skills === "*" ? bindings.SKILLS : config.skills;
  assert.ok(config.count > 0 && config.count <= pool.length, `${className} has a valid skill choice count`);
  for (const skill of pool) {
    const entry = skills.byName.get(skill);
    assert.ok(entry, `${className} skill resolves in Compendium: ${skill}`);
    assert.strictEqual(
      entry.id,
      bindings.catalogueId("skill", skill),
      `${skill} uses canonical Skill id`
    );
  }
}

assert.strictEqual(new Set(bindings.SKILLS).size, 18, "standard D&D skill set has 18 unique skills");
assert.ok(manifest.length >= 80, "expanded creator ships a substantial additive Compendium seed manifest");

console.log("character creator Compendium validation passed");