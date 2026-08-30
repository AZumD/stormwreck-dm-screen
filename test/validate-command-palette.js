/**
 * Validates universal command palette wiring.
 * Run: node test/validate-command-palette.js
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

const palette = fs.readFileSync(path.join(root, "js/core/command-palette.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const sandbox = fs.readFileSync(path.join(root, "campaigns/sandbox/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const i18n = fs.readFileSync(path.join(root, "js/i18n/en.js"), "utf8");

[
  "window.CommandPalette",
  "findMatches",
  "refreshSceneIndex",
  "openPalette",
  "ctrlKey",
  "metaKey",
  "navigateToScene",
  "jumpToCurrentScene",
  "openParty",
  "openMusic",
  "DEFAULT_IDS"
].forEach((token) => {
  if (!palette.includes(token)) fail(`command-palette.js missing ${token}`);
  else pass(`command-palette has ${token}`);
});

if (!app.includes("CommandPalette.init") || !app.includes("bindCommandPalette")) {
  fail("campaign-app missing CommandPalette wiring");
} else pass("campaign-app wires CommandPalette");

if (!app.includes("navigateToScene") || !app.includes('setWorkspace("run"')) {
  fail("scene navigation should switch to Run workspace");
} else pass("scene palette routes to Run");

if (app.includes("bindCatalogueSearch") || app.includes("findCatalogueMatches")) {
  fail("campaign-app should not retain old catalogue-only search");
} else pass("catalogue search replaced by command palette");

for (const [label, page] of [
  ["stormwreck", html],
  ["sandbox", sandbox]
]) {
  if (!page.includes("command-palette.js")) fail(`${label} missing command-palette script`);
  else pass(`${label} loads command-palette.js`);

  if (!page.includes("Search or jump") || !page.includes("catalogue-search__hint")) {
    fail(`${label} missing updated search placeholder/hint`);
  } else pass(`${label} search placeholder + shortcut hint`);
}

if (!i18n.includes("commandPalettePlaceholder")) fail("i18n missing command palette strings");
else pass("i18n command palette strings");

if (!css.includes(".catalogue-search__hint") || !css.includes(".catalogue-search__group")) {
  fail("CSS missing command palette styles");
} else pass("command palette CSS");

if (!fs.existsSync(path.join(root, "docs/README/COMMAND-PALETTE.md"))) {
  fail("missing COMMAND-PALETTE.md");
} else pass("COMMAND-PALETTE.md present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll command palette checks passed.");
