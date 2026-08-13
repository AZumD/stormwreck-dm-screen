/**
 * Runtime merge checks for SceneMeta (Node, no browser).
 * Run: node test/validate-scene-meta-runtime.js
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

const code = fs.readFileSync(path.join(root, "js/core/scene-meta.js"), "utf8");
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
vm.runInContext(code, sandbox);
const SceneMeta = sandbox.window.SceneMeta;

const section = {
  id: "drowned-sailors",
  scene: {
    locationId: "dragons-rest",
    entities: [
      { id: "zombie", quantity: 2, note: "Both begin in the surf." },
      { id: "gideon", type: "npc" } /* type must be stripped */
    ],
    connections: [{ sceneId: "inhabitants", label: "Climb toward Dragon's Rest" }]
  }
};

const merged = SceneMeta.get("test-camp", "drowned-sailors", section);
if (merged.locationId !== "dragons-rest") fail("defaults locationId");
else pass("defaults locationId");

if (!merged.entities.some((e) => e.id === "zombie" && e.quantity === 2)) fail("defaults entities");
else pass("defaults entities");

if (merged.entities.some((e) => Object.prototype.hasOwnProperty.call(e, "type"))) {
  fail("stored entity should not keep type");
} else pass("type stripped from entities");

if (!merged.connections.some((c) => c.sceneId === "inhabitants" && !("from" in c))) {
  fail("connections shape");
} else pass("connections have no from");

SceneMeta.addEntity("test-camp", "drowned-sailors", { id: "undead-fortitude", note: "Radiant bypass" }, section);
const afterAdd = SceneMeta.get("test-camp", "drowned-sailors", section);
if (!afterAdd.entities.some((e) => e.id === "undead-fortitude" && e.note === "Radiant bypass")) {
  fail("addEntity");
} else pass("addEntity persists");

const raw = JSON.parse(store.get("test-camp-scene-meta"));
const storedEntity = raw["drowned-sailors"].entities.find((e) => e.id === "undead-fortitude");
if (storedEntity && Object.prototype.hasOwnProperty.call(storedEntity, "type")) {
  fail("localStorage entity has type");
} else pass("localStorage entities have no type");

SceneMeta.setLocationId("test-camp", "drowned-sailors", "beach-harbor", section);
if (SceneMeta.get("test-camp", "drowned-sailors", section).locationId !== "beach-harbor") {
  fail("setLocationId");
} else pass("setLocationId");

SceneMeta.removeEntity("test-camp", "drowned-sailors", "zombie", null, section);
const afterRemove = SceneMeta.get("test-camp", "drowned-sailors", section);
if (afterRemove.entities.some((e) => e.id === "zombie")) fail("removeEntity");
else pass("removeEntity");

/* Defaults unchanged — fresh campaign still sees booklet zombies */
store.clear();
const fresh = SceneMeta.get("fresh-camp", "drowned-sailors", section);
if (!fresh.entities.some((e) => e.id === "zombie")) fail("defaults not mutated");
else pass("defaults not mutated");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll scene-meta runtime checks passed");
