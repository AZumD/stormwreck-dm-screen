/**
 * Validates campaign-state modules and wiring.
 * Run: node test/validate-campaign-state.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const state = read("js/core/campaign-state.js");
const ui = read("js/core/campaign-state-ui.js");
const app = read("js/campaign-app.js");
const entityUi = read("js/core/entity-ui.js");
const html = read("campaigns/stormwreck-isle/index.html");

if (!state.includes("window.CampaignState") || !state.includes("logInteraction")) {
  fail("campaign-state.js missing core API");
} else {
  pass("CampaignState API present");
}

if (!state.includes("-campaign-state") || !state.includes("npcMemory") || !state.includes("timeline")) {
  fail("campaign-state storage shape incomplete");
} else {
  pass("namespaced storage shape");
}

["getSceneState", "setSceneStatus", "getNpcMemory", "addTimelineEntry"].forEach((fn) => {
  if (!state.includes(fn)) fail(`missing ${fn}`);
  else pass(fn);
});

if (!ui.includes("sceneChromeHtml") || !ui.includes("renderHistoryPanel") || !ui.includes("openLogInteraction")) {
  fail("campaign-state-ui missing UI surfaces");
} else {
  pass("CampaignStateUI surfaces");
}

if (!entityUi.includes("addModalEnricher")) fail("EntityUI missing enricher hook");
else pass("EntityUI.addModalEnricher");

if (!app.includes("CampaignStateUI.init") || !app.includes("restoreInitialScene")) {
  fail("campaign-app missing state wiring / restore");
} else {
  pass("campaign-app wires CampaignStateUI + restore");
}

if (!app.includes('case "history"') || !html.includes('data-view="history"')) {
  fail("History panel not wired");
} else {
  pass("History nav/panel");
}

if (!html.includes("campaign-state.js") || !html.includes("campaign-state-ui.js")) {
  fail("campaign HTML missing state scripts");
} else {
  pass("scripts loaded in campaign HTML");
}

if (!html.includes("current-scene-btn") || !html.includes("interaction-dialog")) {
  fail("missing current-scene button or interaction dialog");
} else {
  pass("toolbar + interaction dialog markup");
}

// Must stay generic — no Stormwreck NPC hardcoding in core state modules
["Runara", "Tarak", "Stormwreck", "Blepp"].forEach((name) => {
  if (state.includes(name) || ui.includes(name)) fail(`core state modules hardcode ${name}`);
});
pass("core state modules stay campaign-agnostic");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll campaign-state checks passed.");
