"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "character-creator", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "character-creator.css"), "utf8");
const js = fs.readFileSync(path.join(root, "js", "character-creator-v3.js"), "utf8");
const data = fs.readFileSync(path.join(root, "js", "character-creator-expanded-data.js"), "utf8");
const bindings = fs.readFileSync(path.join(root, "js", "character-creator-compendium-bindings.js"), "utf8");
const gate = fs.readFileSync(path.join(root, "js", "character-creator-gate.js"), "utf8");
const landing = fs.readFileSync(path.join(root, "index.html"), "utf8");
const player = fs.readFileSync(path.join(root, "player", "index.html"), "utf8");

assert.match(html, /id="creator-steps"/, "creator has wizard navigation");
assert.match(html, /id="creator-content"/, "creator has a content workspace");
assert.match(html, /player-api-client\.js/, "creator can save through the Player Companion API");
assert.match(html, /character-creator-gate\.js/, "creator loads through the player-session gate");
assert.doesNotMatch(landing, /href="\/character-creator\/"/, "public landing does not expose character creator");
assert.match(player, /href="\/character-creator\/"[^>]*>New character</, "player home links New character to the full creator");
assert.match(gate, /api\.bootstrap\(\)/, "creator verifies the signed-in player session");
assert.match(gate, /location\.replace\("\/player\/"\)/, "unauthenticated creator visits return to player login");
assert.match(gate, /character-creator-expanded-data\.js/, "gate loads expanded creator data");
assert.match(gate, /character-creator-compendium-bindings\.js/, "gate loads Compendium bindings");
assert.match(gate, /character-creator-v3\.js/, "gate loads the Compendium-aware creator runtime");

for (const ruleset of ["2014", "2024", "both"]) {
  assert.ok(js.includes(`"${ruleset}"`), `creator includes ${ruleset} ruleset support`);
}
for (const step of ["Getting Started", "Class", "Species", "Background", "Abilities", "Feats", "Spells", "Equipment", "Identity", "About", "Review"]) {
  assert.ok(js.includes(`"${step}"`), `creator includes ${step} step`);
}
for (const method of ["standard", "pointbuy", "roll", "manual"]) {
  assert.ok(js.includes(`"${method}"`), `creator includes ${method} ability method`);
}

assert.match(js, /27-point budget/, "point buy exposes its 27-point budget");
assert.match(js, /Roll 4d6 × 6/, "rolling method uses six 4d6-drop-lowest rolls");
assert.match(js, /createStandaloneCharacter/, "creator can persist standalone characters");
assert.match(js, /createCharacter\(campaignId/, "creator can persist campaign characters");
assert.match(js, /patchSheetDirect/, "creator writes linked refs to standalone character sheets");
assert.match(js, /skillRefs/, "creator persists class skill choices as Compendium refs");
assert.match(js, /featureRefs/, "creator persists feats as Feature refs");
assert.match(js, /spellRefs/, "creator persists spells as Spell refs");
assert.match(js, /data-skill=/, "class step exposes Compendium-backed skill selection");
assert.match(js, /Export JSON/, "creator supports portable JSON export");
assert.match(js, /localStorage/, "creator autosaves a local draft");
assert.match(js, /2024 conversion/, "older backgrounds receive a 2024 conversion path");
assert.match(js, /data-species-bonus/, "expanded 2014 species can assign flexible ability boosts");
assert.doesNotMatch(js, /Choose the ancestry that fits the character/, "species cards do not repeat placeholder ancestry copy");

for (const expanded of ["Artificer", "Aarakocra", "Goblin", "Kobold", "Plasmoid", "Tabaxi", "Warforged", "Haunted One", "Wildspacer", "Witchlight Hand"]) {
  assert.ok(data.includes(`name: "${expanded}"`) || data.includes(`"${expanded}"`), `expanded seed includes ${expanded}`);
}
assert.match(data, /description:/, "seeded options include descriptive blurbs");
assert.match(data, /legacy2024: true/, "expanded legacy options are marked for 2024 compatibility");
assert.match(bindings, /CLASS_SKILLS/, "creator has a structured class-to-skill binding table");
assert.match(bindings, /featRef/, "creator has a canonical feat-to-Feature ref helper");
assert.match(css, /\.ability-card\[data-ability="str"\]/, "abilities receive distinct visual treatment");

console.log("character creator validation passed");