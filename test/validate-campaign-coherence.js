/**
 * Campaign UX coherence checks after Phases 1–8.
 * Run: node test/validate-campaign-coherence.js
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
const storm = read("campaigns/stormwreck-isle/index.html");
const sandbox = read("campaigns/sandbox/index.html");
const i18n = read("js/i18n/en.js");
const palette = read("js/core/command-palette.js");
const dayTime = read("js/core/day-time-ui.js");

if (!app.includes("closeReferencePanel") || !app.includes("bindGlobalEscape") || !app.includes("isReferenceOpen")) {
  fail("campaign-app missing Reference close / Escape stack");
} else pass("Reference close + Escape stack");

if (!app.includes("showReferencePanel(resolved.tab)")) {
  fail("showPanelView should route all Reference via showReferencePanel");
} else pass("unified Reference routing");

if (!palette.includes("isOpen")) fail("CommandPalette missing isOpen");
else pass("CommandPalette isOpen");

if (!dayTime.includes("isOpen")) fail("DayTimeUI missing isOpen");
else pass("DayTimeUI isOpen");

if (i18n.includes('history: "History"')) fail('i18n headings.history should be "Log"');
else pass('Session Log terminology (headings.history = Log)');

const requiredIds = [
  "workspace-run",
  "workspace-prep",
  "workspace-map",
  "workspace-session",
  "search",
  "current-scene-btn",
  "campaign-time",
  "session-view",
  "catalogue-search"
];

for (const [label, html] of [
  ["stormwreck", storm],
  ["sandbox", sandbox]
]) {
  requiredIds.forEach((id) => {
    if (!html.includes(`id="${id}"`)) fail(`${label} missing #${id}`);
    else pass(`${label} has #${id}`);
  });

  if (html.includes("Current scene")) fail(`${label} Current Scene label inconsistent`);
  else if (!html.includes("Current Scene")) fail(`${label} missing Current Scene button`);
  else pass(`${label} Current Scene label`);

  if (html.includes('data-view="session"') || html.includes("edit-mode-toggle") || html.includes("map-panel-toggle")) {
    fail(`${label} obsolete nav/toolbar controls`);
  } else pass(`${label} no obsolete primary controls`);
}

if (!fs.existsSync(path.join(root, "docs/README/VALIDATE-CAMPAIGN-COHERENCE.md"))) {
  fail("missing VALIDATE-CAMPAIGN-COHERENCE.md");
} else pass("VALIDATE-CAMPAIGN-COHERENCE.md present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll campaign coherence checks passed.");
