/**
 * Validates Reference quick-reference UI wiring.
 * Run: node test/validate-reference-ui.js
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

const ref = fs.readFileSync(path.join(root, "js/core/reference-ui.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const prefs = fs.readFileSync(path.join(root, "js/core/campaign-prefs.js"), "utf8");
const entity = fs.readFileSync(path.join(root, "js/core/entity-ui.js"), "utf8");
const palette = fs.readFileSync(path.join(root, "js/core/command-palette.js"), "utf8");
const html = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");

[
  "window.ReferenceUI",
  "getSceneContextEntities",
  "trackEntityOpen",
  "overview",
  "data-reference-tab",
  "data-ref-entity",
  "data-ref-unpin"
].forEach((token) => {
  if (!ref.includes(token)) fail(`reference-ui.js missing ${token}`);
  else pass(`reference-ui has ${token}`);
});

if (!prefs.includes("referencePins") || !prefs.includes("referenceRecent")) {
  fail("CampaignPrefs missing reference pins/recents");
} else pass("CampaignPrefs stores pins/recents");

if (!entity.includes("addOpenListener")) fail("EntityUI missing addOpenListener");
else pass("EntityUI open listener hook");

if (!app.includes("ReferenceUI.init") || !app.includes("getReferenceContextSceneId")) {
  fail("campaign-app missing Reference wiring");
} else pass("campaign-app wires ReferenceUI");

if (!app.includes('id: "overview"') && !app.includes('"overview"')) {
  fail("campaign-app missing Reference overview tab");
} else pass("Reference overview tab");

  if (!palette.includes("reference-overview") || !palette.includes('id: "overview"')) {
    fail("command palette missing Reference overview default");
  } else pass("command palette Reference overview");

if (!html.includes("reference-ui.js")) fail("campaign HTML missing reference-ui.js");
else pass("campaign loads reference-ui.js");

if (!css.includes(".ref-quick-card") || !css.includes(".entity-pin-btn")) {
  fail("CSS missing reference overview styles");
} else pass("reference overview CSS");

if (!fs.existsSync(path.join(root, "docs/README/REFERENCE-UI.md"))) {
  fail("missing REFERENCE-UI.md");
} else pass("REFERENCE-UI.md present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll reference UI checks passed.");
