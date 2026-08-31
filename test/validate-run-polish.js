/**
 * Campaign Run visual polish — authoring controls stay in Prep, compact live chrome.
 * Run: node test/validate-run-polish.js
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

const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const stateUi = fs.readFileSync(path.join(root, "js/core/campaign-state-ui.js"), "utf8");
const sceneUi = fs.readFileSync(path.join(root, "js/core/scene-ui.js"), "utf8");
const parser = fs.readFileSync(path.join(root, "js/core/parser.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const party = fs.readFileSync(path.join(root, "js/core/party.js"), "utf8");

if (!app.includes("sceneChromeHtml(section.id, { compact: true })")) {
  fail("renderPlayScene must use compact scene chrome");
} else pass("Run compact scene chrome");

if (app.includes("SceneUI.sceneExtrasHtml(section.id)") && !app.includes("authoring: true")) {
  fail("Run must not render scene extras without authoring flag");
} else pass("Run omits authoring scene extras");

if (!sceneUi.includes("sceneExtrasHtml(sectionId, options") || !sceneUi.includes("workspace-prep")) {
  fail("SceneUI must gate extras to authoring/Prep");
} else pass("SceneUI authoring gate");

if (!stateUi.includes("scene-state--compact") || !stateUi.includes("scene-notes-details")) {
  fail("CampaignStateUI missing compact Run chrome");
} else pass("compact Run chrome markup");

if (!stateUi.includes("isCompactChromeHost") || !stateUi.includes("play-view")) {
  fail("CampaignStateUI must refresh compact chrome in play view");
} else pass("play-view chrome refresh");

if (!parser.includes("scene-cue")) {
  fail("parser should wrap media chips in scene-cue strip");
} else pass("scene-cue media strip");

if (!css.includes(".play-scene.scene-completed .section-title::after")) {
  fail("Run should remove redundant DONE title badge");
} else pass("no duplicate DONE on Run title");

if (!css.includes(".scene-state--compact") || !css.includes(".play-scene-nav__btn--next")) {
  fail("CSS missing Run polish classes");
} else pass("Run polish CSS");

if (!party.includes("party-card__stat") || !party.includes("Level ${entry.level}")) {
  fail("party card hierarchy update missing");
} else pass("party card hierarchy");

if (!css.includes("--map-panel-width: 280px")) {
  fail("map panel width should be modestly reduced");
} else pass("narrower party rail default");

if (!fs.existsSync(path.join(root, "docs/README/VALIDATE-RUN-POLISH.md"))) {
  fail("missing VALIDATE-RUN-POLISH.md");
} else pass("VALIDATE-RUN-POLISH.md present");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll Run polish checks passed.");
