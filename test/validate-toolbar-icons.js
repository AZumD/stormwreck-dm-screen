/**
 * Validates campaign toolbar workspace switcher + no auto chapter headings.
 * Run: node test/validate-toolbar-icons.js
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

const html = read("campaigns/stormwreck-isle/index.html");
const sandboxHtml = read("campaigns/sandbox/index.html");
const app = read("js/campaign-app.js");
const css = read("css/style.css");

if (html.includes("sidebar-toggle__label") || /Navigation<\/span>/.test(html)) {
  fail("nav toggle still shows Navigation label");
} else pass("nav toggle icon-only");

if (html.includes('id="edit-mode-toggle"') || html.includes("toolbar-icon--edit")) {
  fail("Run toolbar still exposes Edit mode toggle");
} else pass("no Edit mode toggle in primary toolbar");

if (html.includes("view-mode-play") || html.includes("toolbar-icon--play")) {
  fail("Run toolbar still exposes Play/Document toggle");
} else pass("no Play/Document toggle in primary toolbar");

for (const [label, page] of [
  ["stormwreck", html],
  ["sandbox", sandboxHtml]
]) {
  if (!page.includes('id="workspace-run"') || !page.includes('id="workspace-prep"') || !page.includes('id="workspace-map"')) {
    fail(`${label} missing Run|Prep|Map workspace switcher`);
  } else if (!/>Run</.test(page) || !/>Prep</.test(page) || !/>Map</.test(page)) {
    fail(`${label} workspace switcher must use text labels`);
  } else pass(`${label} Run|Prep|Map workspace switcher`);

  if (page.includes('id="map-panel-toggle"')) {
    fail(`${label} still has map-panel-toggle (Map is a workspace)`);
  } else pass(`${label} no map-panel-toggle`);

  if (page.includes('id="day-time-bar"')) {
    fail(`${label} still has persistent day-time-bar`);
  } else if (!page.includes('id="campaign-time"') || !page.includes("campaign-time-trigger")) {
    fail(`${label} missing compact campaign-time control`);
  } else pass(`${label} compact campaign-time control`);
}

if (!app.includes("setWorkspace") || !app.includes('activeWorkspace = "run"')) {
  fail("campaign-app missing workspace state");
} else pass("campaign-app workspace state");

if (app.includes("nav-chapter") && app.includes("chapterLi.textContent = chapter.title")) {
  fail("sidebar still injects chapter titles");
} else pass("sidebar has no chapter headings");

if (app.includes("play-scene__chapter") || app.includes("chapter-divider")) {
  fail("Play/Document still render chapter headings");
} else pass("no auto chapter headings in views");

if (!css.includes(".workspace-switch") || !css.includes(".workspace-switch__btn")) {
  fail("workspace switch CSS missing");
} else pass("workspace switch CSS");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll toolbar icon checks passed");
