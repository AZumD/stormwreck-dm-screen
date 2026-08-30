/**
 * Campaign sidebar Tools / Reference+Session workspaces, Document scrollspy, Run|Prep.
 * Run: node test/validate-campaign-nav.js
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

const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const prefs = fs.readFileSync(path.join(root, "js/core/campaign-prefs.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const stormHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const sandboxHtml = fs.readFileSync(path.join(root, "campaigns/sandbox/index.html"), "utf8");

if (app.includes('activeView.type !== "scroll"')) {
  fail("scrollspy still checks obsolete scroll view type");
} else if (!app.includes('activeView.type !== "document"')) {
  fail("scrollspy must gate on document view");
} else pass("Document scrollspy uses activeView.type document");

if (!app.includes("syncFocus") || !app.includes("highlightNavSection")) {
  fail("scrollspy should sync focused scene / hash while scrolling");
} else pass("scrollspy syncs focus + hash");

[
  "resolvePanelRequest",
  "REFERENCE_TABS",
  "SESSION_TABS",
  "renderWorkspaceTabs",
  "reference:npcs",
  "session:history",
  "panel-workspace__tab",
  'case "history"',
  'case "npcs"',
  "setWorkspace",
  "loadWorkspace",
  'activeWorkspace = "run"'
].forEach((token) => {
  if (!app.includes(token)) fail(`campaign-app missing ${token}`);
  else pass(`campaign-app has ${token}`);
});

for (const [label, html] of [
  ["stormwreck", stormHtml],
  ["sandbox", sandboxHtml]
]) {
  if (!html.includes('data-view="reference"') || !html.includes('data-view="session"')) {
    fail(`${label} missing Reference/Session tools nav`);
  } else pass(`${label} Tools nav has Reference + Session`);

  if (html.includes('data-view="npcs"') || html.includes('data-view="history"')) {
    fail(`${label} still lists leaf panels in sidebar`);
  } else pass(`${label} sidebar no longer lists leaf panels`);

  if (!html.includes(">Tools<")) fail(`${label} missing Tools section heading`);
  else pass(`${label} Tools section heading`);

  if (!html.includes('id="workspace-run"') || !html.includes('id="workspace-prep"')) {
    fail(`${label} missing Run|Prep switcher`);
  } else pass(`${label} Run|Prep switcher`);

  if (html.includes('id="edit-mode-toggle"') || html.includes('id="view-mode-play"')) {
    fail(`${label} still has Edit / Play-Document primary toggles`);
  } else pass(`${label} primary toolbar free of Edit/Play-Document`);
}

if (!prefs.includes("referenceTab") || !prefs.includes("sessionTab")) {
  fail("CampaignPrefs missing referenceTab/sessionTab");
} else pass("CampaignPrefs remembers workspace tabs");

if (!prefs.includes('workspace: "run"') || !prefs.includes("normalizeWorkspace")) {
  fail("CampaignPrefs missing Run/Prep workspace");
} else pass("CampaignPrefs remembers Run/Prep workspace");

if (!css.includes(".panel-workspace__tab") || !css.includes("position: sticky")) {
  fail("style.css missing sticky panel workspace tabs");
} else pass("panel workspace tab styles");

if (!css.includes(".workspace-switch")) {
  fail("style.css missing workspace-switch");
} else pass("workspace-switch styles");

if (!fs.existsSync(path.join(root, "docs/README/VALIDATE-CAMPAIGN-NAV.md"))) {
  fail("missing VALIDATE-CAMPAIGN-NAV.md");
} else pass("VALIDATE-CAMPAIGN-NAV.md present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll campaign nav checks passed.");
