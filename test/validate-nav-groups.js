/**
 * Validates sidebar scene-group wiring (markup helpers, CSS, i18n).
 * Run: node test/validate-nav-groups.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

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
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const i18n = fs.readFileSync(path.join(root, "js/i18n/en.js"), "utf8");

[
  "buildNavItems",
  "createNavGroupItem",
  "nav-scene-group",
  "nav-scene-group__drag",
  "addNavGroup",
  "nav-group-collapsed",
  "moveScene",
  "reorderGroups",
  "nav-add-scene"
].forEach((token) => {
  if (!app.includes(token)) fail(`campaign-app missing ${token}`);
  else pass(`campaign-app has ${token}`);
});

if (!css.includes(".nav-scene-group__summary") || !css.includes(".nav-scene-group__list") || !css.includes(".nav-scene-group__drag")) {
  fail("css missing group chrome / drag handle");
} else {
  pass("css nav-scene-group chrome");
}

["addGroup", "confirmDeleteGroup", "newGroupPrompt", "emptyGroupHint", "dragGroupHint"].forEach((key) => {
  if (!i18n.includes(key)) fail(`i18n missing ${key}`);
});
pass("i18n group strings");

/* Runtime: group membership + unknown groupId stripped */
const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
const sandbox = { window: {}, localStorage, console, Date, Math, Number, String, Array, Object, JSON, Boolean };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(editorSrc, sandbox);
const SE = sandbox.window.SectionEditor;

SE.bootstrap("nav-g", []);
SE.addGroup("nav-g", { id: "grp-a", title: "A" });
const scene = SE.addSection("nav-g", { title: "In A", content: "x", groupId: "grp-a" });
SE.addSection("nav-g", { title: "Root", content: "y" });
const sections = SE.getSections("nav-g");
if (sections.find((s) => s.id === scene.id)?.groupId !== "grp-a") fail("groupId not on getSections");
else pass("getSections returns groupId");

SE.setSceneGroup("nav-g", scene.id, null);
if (SE.getSections("nav-g").find((s) => s.id === scene.id)?.groupId) fail("clear groupId failed");
const rejected = SE.setSceneGroup("nav-g", scene.id, "missing-group");
if (rejected) fail("unknown groupId should be rejected");
else if (SE.getSections("nav-g").find((s) => s.id === scene.id)?.groupId) fail("rejected set still applied");
else pass("setSceneGroup rejects unknown group");

/* Persist round-trip */
store.set(
  "nav-g-section-structure",
  JSON.stringify({
    groups: [{ id: "grp-b", title: "B" }],
    scenes: [
      { id: "s1", title: "One", content: "", groupId: "grp-b" },
      { id: "s2", title: "Two", content: "", groupId: "nope" }
    ]
  })
);
sandbox.window.SectionEditor = null;
vm.runInContext(editorSrc, sandbox);
const SE2 = sandbox.window.SectionEditor;
SE2.bootstrap("nav-g", []);
const loaded = SE2.getSections("nav-g");
if (loaded.find((s) => s.id === "s1")?.groupId !== "grp-b") fail("groupId not reloaded");
else if (loaded.find((s) => s.id === "s2")?.groupId) fail("invalid groupId not stripped on load");
else pass("normalize strips unknown groupId on load");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll nav-group checks passed.");
