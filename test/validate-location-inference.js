/**
 * Validates scene-first location inference wiring.
 * Run: node test/validate-location-inference.js
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const ui = read("js/core/campaign-state-ui.js");
const app = read("js/campaign-app.js");
const metaSrc = read("js/core/scene-meta.js");

if (!ui.includes("SceneMeta.getLocationId") || !ui.includes("inferMapLocationId")) {
  fail("inferLocationId should prefer SceneMeta then map");
} else pass("inferLocationId prefers scene then map");

if (!ui.includes("getFocusedSceneId") || !ui.includes("resolveContextSceneId")) {
  fail("inferLocationId missing scene context resolution");
} else pass("scene context resolution");

if (!app.includes("getFocusedSceneId:") || !app.includes("getSectionBase")) {
  fail("campaign-app must pass focused scene + section base to CampaignStateUI");
} else pass("campaign-app wires focused scene to CampaignStateUI");

if (!metaSrc.includes("getLocationId")) fail("SceneMeta.getLocationId missing");
else pass("SceneMeta.getLocationId");

/* Runtime priority: scene location wins over map location when both set */
const store = new Map();
const sandbox = {
  window: {},
  console,
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v))
  }
};
vm.createContext(sandbox);
vm.runInContext(metaSrc, sandbox);
const SceneMeta = sandbox.window.SceneMeta;

const section = {
  id: "drowned-sailors",
  scene: { locationId: "dragons-rest", entities: [], connections: [] }
};

function preferLocation(sceneLoc, mapLoc) {
  return (sceneLoc || "").trim() || (mapLoc || "").trim() || "";
}

const sceneLoc = SceneMeta.getLocationId("camp", "drowned-sailors", section);
const inferred = preferLocation(sceneLoc, "seagrow-caves");
if (inferred !== "dragons-rest") fail("scene location should beat map location");
else pass("scene location beats map location");

const emptySection = { id: "blank", scene: { entities: [], connections: [] } };
const blankLoc = SceneMeta.getLocationId("camp", "blank", emptySection);
const fallback = preferLocation(blankLoc, "seagrow-caves");
if (fallback !== "seagrow-caves") fail("map location fallback when scene has none");
else pass("map location fallback when scene has none");

SceneMeta.setLocationId("camp", "blank", "", emptySection);
const cleared = preferLocation(SceneMeta.getLocationId("camp", "blank", emptySection), "seagrow-caves");
if (cleared !== "seagrow-caves") fail("cleared scene location falls back to map");
else pass("cleared scene location falls back to map");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll location-inference checks passed");
