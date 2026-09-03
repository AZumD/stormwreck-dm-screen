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
const manifest = [
  ...require(path.join(root, "server", "seeds", "character-creator-compendium.js")),
  ...require(path.join(root, "server", "seeds", "character-backgrounds.js"))
];

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
const backgrounds = indexType("background");
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

for (const background of creator.BACKGROUNDS) {
  const entry = backgrounds.byName.get(background.name);
  assert.ok(entry, `creator background has Compendium entry: ${background.name}`);
  assert.strictEqual(
    entry.id,
    bindings.catalogueId("background", background.name),
    `creator background uses canonical Compendium id: ${background.name}`
  );
  if (background.feat) {
    assert.deepStrictEqual(
      Array.from(entry.originFeatRefs || []),
      [bindings.featRef(background.feat)],
      `${background.name} links its origin feat through the Feature catalogue`
    );
  }
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

const createCalls = [];
sandbox.window.PlayerApiClient = {
  createStandaloneCharacter(payload) {
    createCalls.push({ mode: "standalone", payload });
    return payload;
  },
  createCharacter(campaignId, payload) {
    createCalls.push({ mode: "campaign", campaignId, payload });
    return payload;
  }
};
vm.runInContext(
  fs.readFileSync(path.join(root, "js", "character-creator-background-link.js"), "utf8"),
  sandbox
);

const backgroundLink = sandbox.window.StormwreckCharacterCreatorBackgroundLink;
assert.ok(backgroundLink, "creator exposes the background persistence seam");
assert.strictEqual(
  backgroundLink.linkBackgroundPayload({ background: "Acolyte" }).background,
  bindings.ref("background", "Acolyte"),
  "plain creator backgrounds normalize to canonical @background refs"
);
assert.strictEqual(
  backgroundLink.linkBackgroundPayload({ background: bindings.ref("background", "Sage") }).background,
  bindings.ref("background", "Sage"),
  "already-linked backgrounds remain unchanged"
);

sandbox.window.PlayerApiClient.createStandaloneCharacter({ name: "Ada", background: "Sage" });
sandbox.window.PlayerApiClient.createCharacter("campaign-demo", { name: "Borin", background: "Soldier" });
assert.strictEqual(
  createCalls[0].payload.background,
  bindings.ref("background", "Sage"),
  "standalone character creation persists a Background Compendium ref"
);
assert.strictEqual(
  createCalls[1].payload.background,
  bindings.ref("background", "Soldier"),
  "campaign character creation persists a Background Compendium ref"
);

const gateSource = fs.readFileSync(path.join(root, "js", "character-creator-gate.js"), "utf8");
const bindingPos = gateSource.indexOf("character-creator-compendium-bindings.js");
const backgroundPos = gateSource.indexOf("character-creator-background-link.js");
const creatorPos = gateSource.indexOf("character-creator-v3.js");
assert.ok(
  bindingPos >= 0 && backgroundPos > bindingPos && creatorPos > backgroundPos,
  "background persistence seam loads after Compendium bindings and before creator v3"
);

assert.strictEqual(new Set(bindings.SKILLS).size, 18, "standard D&D skill set has 18 unique skills");
assert.ok(manifest.length >= 100, "expanded creator ships a substantial additive Compendium seed manifest");
assert.ok(
  manifest.filter((seed) => seed.type === "background").length >= creator.BACKGROUNDS.length,
  "expanded creator ships Background Compendium seeds"
);

console.log("character creator Compendium validation passed");
