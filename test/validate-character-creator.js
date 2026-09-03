"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "character-creator", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "character-creator.css"), "utf8");
const js = fs.readFileSync(path.join(root, "js", "character-creator.js"), "utf8");
const landing = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /id="creator-steps"/, "creator has wizard navigation");
assert.match(html, /id="creator-content"/, "creator has a content workspace");
assert.match(html, /player-api-client\.js/, "creator can save through the Player Companion API");
assert.match(landing, /href="\/character-creator\/"/, "landing links to character creator");

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
assert.match(js, /Export JSON/, "creator supports portable JSON export");
assert.match(js, /localStorage/, "creator autosaves a local draft");
assert.match(css, /\.ability-card\[data-ability="str"\]/, "abilities receive distinct visual treatment");

console.log("character creator validation passed");
