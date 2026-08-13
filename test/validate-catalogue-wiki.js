/**
 * Validates catalogue wiki (read) view + edit-mode toggle.
 * Run: node test/validate-catalogue-wiki.js
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

const app = read("js/core/catalogue/app.js");
const css = read("css/catalogue.css");

if (!app.includes("function renderWikiView")) fail("missing renderWikiView");
else pass("renderWikiView present");

if (!app.includes('data-action="edit"')) fail("wiki missing Edit action");
else pass("wiki Edit button");

if (!app.includes('data-action="done"')) fail("form missing Done action");
else pass("form Done button");

if (!app.includes('mode: "edit"') || !app.includes('mode: "view"')) {
  fail("missing view/edit mode switches");
} else {
  pass("view/edit mode switches");
}

if (!app.includes("bindWikiEvents")) fail("missing bindWikiEvents");
else pass("bindWikiEvents present");

if (!app.includes('renderEditor(entry.id, { mode: "edit" })')) {
  fail("new entry should open in edit mode");
} else {
  pass("new entry opens edit mode");
}

if (!app.includes('renderEditor(btn.dataset.id, { mode: "view" })')) {
  fail("list click should open wiki view");
} else {
  pass("list click opens wiki view");
}

if (!css.includes(".cat-wiki") || !css.includes(".cat-wiki__title")) {
  fail("catalogue.css missing wiki styles");
} else {
  pass("wiki styles in catalogue.css");
}

if (!css.includes(".cat-form__actions")) fail("missing form actions layout");
else pass("form actions layout");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll catalogue wiki checks passed");
