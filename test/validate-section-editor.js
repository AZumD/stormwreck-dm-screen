/**
 * Free-form SectionEditor: scenes[], migrate, reorder, unified delete.
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

const editorSrc = fs.readFileSync(path.join(root, "js/core/editor.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const i18n = fs.readFileSync(path.join(root, "js/i18n/en.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");

["getSections", "addSection", "deleteSection", "reorderScenes", "migrateLegacy", "bootstrap"].forEach((name) => {
  if (!editorSrc.includes(`function ${name}`)) fail(`editor.js missing ${name}`);
  else pass(`editor.js has ${name}`);
});

if (editorSrc.includes("function resetSection") || editorSrc.includes("function restoreAllDeleted")) {
  fail("legacy reset/restore should be removed");
} else pass("legacy reset/restore removed");

if (!editorSrc.includes("scenes:") && !editorSrc.includes("scenes =")) {
  fail("editor missing scenes structure");
} else pass("editor uses scenes[]");

if (!app.includes("bindNavDragReorder") || !app.includes("reorderScenes")) {
  fail("campaign-app missing drag reorder wiring");
} else pass("campaign-app drag reorder");

if (app.includes("ADVENTURE.chapters.forEach")) {
  fail("campaign-app should not loop ADVENTURE.chapters for nav/document");
} else pass("flat scene list (no chapter loop)");

if (app.includes("isCustomSection") || app.includes("restoreAllDeleted") || app.includes("resetSectionEditor")) {
  fail("campaign-app still references custom/reset/restore");
} else pass("campaign-app unified scene UI");

if (!app.includes("SectionEditor.bootstrap(campaignId, ADVENTURE.sections")) {
  fail("bootstrap should pass booklet sections for one-shot migrate");
} else pass("bootstrap passes booklet for migrate");

if (!i18n.includes("confirmDeleteScene") || !i18n.includes("noScenesHint")) {
  fail("i18n missing free-form scene strings");
} else pass("i18n free-form strings");

if (!css.includes("nav-scene-item--draggable") || !css.includes("is-drop-target")) {
  fail("css missing drag reorder styles");
} else pass("css drag reorder styles");

/* Runtime smoke */
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

const SectionEditor = new Function("window", `${editorSrc}\nreturn window.SectionEditor;`)(global);

const base = [
  { id: "a", chapter: "intro", title: "A", content: "<p>A</p>" },
  { id: "b", chapter: "intro", title: "B", content: "<p>B</p>" },
  { id: "c", chapter: "ch-1", title: "C", content: "<p>C</p>" }
];

/* Fresh campaign: empty scenes */
SectionEditor.bootstrap("fresh", []);
let sections = SectionEditor.getSections("fresh");
if (sections.length !== 0) fail(`fresh should start empty, got ${sections.length}`);
else pass("fresh campaign starts with empty scenes");

const created = SectionEditor.addSection("fresh", { title: "Inserted", content: "<p>New</p>" });
sections = SectionEditor.getSections("fresh");
if (sections.length !== 1 || sections[0].id !== created.id) fail("addSection failed");
else pass("addSection appends scene");

SectionEditor.addSection("fresh", { afterId: created.id, title: "After", content: "<p>2</p>" });
sections = SectionEditor.getSections("fresh");
if (sections[1].title !== "After") fail("insert after failed");
else pass("addSection inserts after neighbor");

SectionEditor.reorderScenes("fresh", [sections[1].id, sections[0].id]);
sections = SectionEditor.getSections("fresh");
if (sections[0].title !== "After") fail("reorder failed");
else pass("reorderScenes works");

SectionEditor.deleteSection("fresh", sections[0].id);
sections = SectionEditor.getSections("fresh");
if (sections.some((s) => s.title === "After")) fail("delete left scene");
else pass("deleteSection removes scene");

/* Legacy migrate */
store["legacy-section-structure"] = JSON.stringify({
  deleted: ["b"],
  custom: [
    {
      id: "custom-x",
      chapter: "intro",
      title: "X",
      content: "<p>X</p>",
      afterId: "a",
      createdAt: 1
    }
  ]
});
store["legacy-section-edits"] = JSON.stringify({
  a: { title: "A edited", content: "<p>Ae</p>" }
});

delete global.window;
global.window = global;
/* Reset mem by new IIFE */
Object.keys(require.cache).forEach((k) => {
  /* n/a — we re-eval */
});
const SectionEditor2 = new Function("window", `${editorSrc}\nreturn window.SectionEditor;`)(global);
global.localStorage = localStorageMock;

SectionEditor2.bootstrap("legacy", base);
const migrated = SectionEditor2.getSections("legacy");
const migIds = migrated.map((s) => s.id);
if (!migIds.includes("a") || migIds.includes("b") || !migIds.includes("custom-x")) {
  fail(`migrate ids wrong: ${migIds.join(",")}`);
} else pass("legacy migrate omits deleted, keeps custom");

if (migrated.find((s) => s.id === "a")?.title !== "A edited") fail("migrate should fold edits");
else pass("legacy migrate folds section-edits");

const xIdx = migIds.indexOf("custom-x");
const aIdx = migIds.indexOf("a");
if (xIdx !== aIdx + 1) fail(`custom should follow a: ${migIds.join(",")}`);
else pass("legacy migrate respects afterId");

const stored = JSON.parse(store["legacy-section-structure"]);
if (!Array.isArray(stored.scenes) || stored.custom) fail("persisted structure should be scenes-only");
else pass("persisted shape is scenes[]");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll section-editor checks passed.");
