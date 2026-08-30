/**
 * Live-session shell invariants (UX Phase 11).
 * Run: node test/validate-live-session.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function pass(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const app = read("js/campaign-app.js");
const palette = read("js/core/command-palette.js");
const entityUi = read("js/core/entity-ui.js");
const entityReg = read("js/core/entity-registry.js");
const stateUi = read("js/core/campaign-state-ui.js");
const dayTime = read("js/core/day-time-ui.js");
const i18n = read("js/i18n/en.js");
const css = read("css/style.css");
const storm = read("campaigns/stormwreck-isle/index.html");
const sandbox = read("campaigns/sandbox/index.html");

if (!palette.includes("paletteReturnFocus")) fail("command palette missing focus restore");
else pass("command palette focus restore");

if (!palette.includes('"curr"') || !palette.includes('"chron"') || !palette.includes('"mus"')) {
  fail("command palette missing live-session abbreviation keywords");
} else pass("command palette abbreviation keywords");

if (!entityUi.includes("modalReturnFocus") || !entityUi.includes("restoreModalFocus")) {
  fail("entity modal missing focus restore");
} else pass("entity modal focus restore");

if (!entityUi.includes("Compendium")) fail("missing-entity copy should reference Compendium");
else pass("missing-entity Compendium copy");

if (!entityReg.includes("Role: entry.role")) fail("NPC entity should surface Role in stats");
else pass("NPC Role in stats");

const monsterIdx = entityReg.indexOf("function monsterToEntity");
const actionsIdx = entityReg.indexOf('refsBlock("Actions"', monsterIdx);
const traitsIdx = entityReg.indexOf('refsBlock("Traits"', monsterIdx);
if (actionsIdx < 0 || traitsIdx < 0 || actionsIdx > traitsIdx) {
  fail("monster details should list Actions before Traits");
} else pass("monster combat-first detail order");

if (!stateUi.includes("aria-pressed") || !stateUi.includes("sceneMarkCurrent")) {
  fail("scene status controls missing aria-pressed / mark tooltips");
} else pass("scene status aria + tooltips");

if (!app.includes("referenceReturnFocus")) fail("Reference close missing focus restore");
else pass("Reference focus restore");

if (!dayTime.includes("openPopover") || !dayTime.includes("data-time-preset")) {
  fail("DayTimeUI openPopover should focus popover control");
} else pass("campaign time openPopover feedback");

if (!i18n.includes('jumpToCurrentScene: "Jump to live current scene"')) {
  fail("i18n jumpToCurrentScene should describe action not button label");
} else pass("Current Scene tooltip wording");

if (!i18n.includes("currentSceneButton")) fail("i18n missing currentSceneButton");
else pass("currentSceneButton label");

if (!css.includes("@media (max-height: 820px)")) fail("CSS missing short-viewport toolbar compaction");
else pass("short-viewport CSS");

const shellIds = [
  "workspace-run",
  "workspace-prep",
  "workspace-map",
  "workspace-session",
  "search",
  "current-scene-btn",
  "campaign-time",
  "catalogue-search"
];

const obsolete = ["edit-mode-toggle", 'data-view="session"'];

for (const [label, html] of [
  ["stormwreck", storm],
  ["sandbox", sandbox]
]) {
  shellIds.forEach((id) => {
    if (!html.includes(`id="${id}"`)) fail(`${label} Run shell missing #${id}`);
    else pass(`${label} has #${id}`);
  });

  obsolete.forEach((token) => {
    if (html.includes(token)) fail(`${label} obsolete control ${token}`);
  });
  pass(`${label} no obsolete Run shell controls`);
}

if (!app.includes("closeReferencePanel") || !app.includes("bindGlobalEscape")) {
  fail("campaign-app missing Reference/Escape stack");
} else pass("Escape stack present");

if (!fs.existsSync(path.join(root, "docs/README/VALIDATE-LIVE-SESSION.md"))) {
  fail("missing VALIDATE-LIVE-SESSION.md");
} else pass("VALIDATE-LIVE-SESSION.md present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll live-session checks passed.");
