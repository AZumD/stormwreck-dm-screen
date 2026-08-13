/**
 * Validates compact toolbar icons + no auto chapter headings.
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
const app = read("js/campaign-app.js");
const css = read("css/style.css");

if (html.includes("sidebar-toggle__label") || /Navigation<\/span>/.test(html)) {
  fail("nav toggle still shows Navigation label");
} else pass("nav toggle icon-only");

if (!html.includes('id="edit-mode-toggle"') || !html.includes("toolbar-icon--edit")) {
  fail("edit mode icon missing");
} else pass("edit mode icon");

if (!html.includes("toolbar-icon--play") || !html.includes("toolbar-icon--document")) {
  fail("play/document icons missing");
} else pass("play/document icons");

if (/>(Play|Document)</.test(html.replace(/aria-label="[^"]*"/g, "").replace(/title="[^"]*"/g, ""))) {
  fail("Play/Document text labels still visible");
} else pass("no Play/Document text labels");

if (app.includes("nav-chapter") && app.includes("chapterLi.textContent = chapter.title")) {
  fail("sidebar still injects chapter titles");
} else pass("sidebar has no chapter headings");

if (app.includes("play-scene__chapter") || app.includes("chapter-divider")) {
  fail("Play/Document still render chapter headings");
} else pass("no auto chapter headings in views");

if (!css.includes("toolbar-btn--icon") || !css.includes("toolbar-icon--play")) {
  fail("toolbar icon CSS missing");
} else pass("toolbar icon CSS");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll toolbar icon checks passed");
