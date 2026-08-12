/**
 * Validates section editor add/delete API surface and campaign wiring.
 * Run: node test/validate-section-editor.js
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

const editor = fs.readFileSync(path.join(root, "js/core/editor.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const i18n = fs.readFileSync(path.join(root, "js/i18n/en.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");

const requiredFns = [
  "getSections",
  "addSection",
  "deleteSection",
  "restoreAllDeleted",
  "isCustomSection",
  "loadStructure"
];

requiredFns.forEach((name) => {
  if (!editor.includes(`function ${name}`) && !editor.includes(`${name},`)) {
    fail(`editor.js missing ${name}`);
  } else {
    pass(`editor.js has ${name}`);
  }
});

if (!editor.includes("section-structure")) fail("editor missing structure storage key");
else pass("editor stores structure in localStorage");

if (!app.includes("addPassage")) fail("campaign-app missing addPassage");
else pass("campaign-app can add passages");

if (!app.includes("deletePassage")) fail("campaign-app missing deletePassage");
else pass("campaign-app can delete passages");

if (!app.includes("SectionEditor.getSections")) fail("campaign-app not using getSections");
else pass("campaign-app renders via getSections");

if (!app.includes("add-passage-btn")) fail("campaign-app missing add passage UI");
else pass("campaign-app shows add passage controls");

if (!i18n.includes("addPassage")) fail("i18n missing addPassage string");
else pass("i18n has add/delete strings");

if (!i18n.includes("deleteSection")) fail("i18n missing deleteSection");
else pass("i18n has deleteSection");

if (!css.includes(".add-passage-btn")) fail("css missing add-passage styles");
else pass("css styles add-passage controls");

if (!css.includes(".section-delete-btn")) fail("css missing delete button styles");
else pass("css styles delete buttons");

/* Logic smoke test with a fake localStorage */
const store = {};
const localStorageMock = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  }
};

global.localStorage = localStorageMock;
global.window = global;

const SectionEditor = new Function("window", `${editor}\nreturn window.SectionEditor;`)(global);

const base = [
  { id: "a", chapter: "intro", title: "A", content: "<p>A</p>" },
  { id: "b", chapter: "intro", title: "B", content: "<p>B</p>" },
  { id: "c", chapter: "ch-1", title: "C", content: "<p>C</p>" }
];

let sections = SectionEditor.getSections("test", base);
if (sections.length !== 3) fail(`expected 3 base sections, got ${sections.length}`);
else pass("getSections returns booklet sections");

const created = SectionEditor.addSection("test", {
  chapter: "intro",
  afterId: "a",
  title: "Inserted",
  content: "<p>New</p>"
});

sections = SectionEditor.getSections("test", base);
const ids = sections.map((s) => s.id);
if (ids.indexOf(created.id) !== ids.indexOf("a") + 1) {
  fail(`custom section not inserted after a: ${ids.join(",")}`);
} else {
  pass("custom section inserts after target");
}

SectionEditor.deleteSection("test", "b", base);
sections = SectionEditor.getSections("test", base);
if (sections.some((s) => s.id === "b")) fail("built-in delete did not hide section b");
else pass("built-in delete soft-hides section");

if (!SectionEditor.getDeletedIds("test").includes("b")) fail("deleted id not tracked");
else pass("deleted booklet ids tracked");

SectionEditor.deleteSection("test", created.id, base);
sections = SectionEditor.getSections("test", base);
if (sections.some((s) => s.id === created.id)) fail("custom delete left section behind");
else pass("custom delete removes section permanently");

SectionEditor.restoreAllDeleted("test");
sections = SectionEditor.getSections("test", base);
if (!sections.some((s) => s.id === "b")) fail("restore did not bring back b");
else pass("restore brings back booklet passages");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll section-editor checks passed.");
