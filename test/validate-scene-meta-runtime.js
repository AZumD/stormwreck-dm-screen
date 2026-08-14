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
  id: "demo-scene",
  scene: {
    locationId: "dragons-rest",
    entities: [
      { id: "runara" },
      { id: "zombie", quantity: 2, note: "Both begin in the surf." },
      { id: "gideon", type: "npc" } /* type must be stripped */
    ],
    connections: [{ sceneId: "next-scene", label: "Continue" }]
  }
};

/* ── Defaults / normalize ─────────────────────────────── */

const merged = SceneMeta.get("test-camp", "demo-scene", section);
if (merged.locationId !== "dragons-rest") fail("defaults locationId");
else pass("defaults locationId");

if (!merged.entities.some((e) => e.id === "runara")) fail("defaults entities");
else pass("defaults entities");

if (merged.entities.some((e) => Object.prototype.hasOwnProperty.call(e, "type"))) {
  fail("stored entity should not keep type");
} else pass("type stripped from entities");

if (!merged.connections.some((c) => c.sceneId === "next-scene" && !("from" in c))) {
  fail("connections shape");
} else pass("connections have no from");

if (SceneMeta.getLocationId("test-camp", "demo-scene", section) !== "dragons-rest") {
  fail("getLocationId");
} else pass("getLocationId");

/* ── Partial mutations preserve other effective fields ── */

store.clear();
SceneMeta.setEntities("camp-a", "demo-scene", [{ id: "myla" }], section);
const afterEntities = SceneMeta.get("camp-a", "demo-scene", section);
if (
  afterEntities.locationId !== "dragons-rest" ||
  !afterEntities.connections.some((c) => c.sceneId === "next-scene") ||
  afterEntities.entities.length !== 1 ||
  afterEntities.entities[0].id !== "myla"
) {
  fail("setEntities preserves location/connections");
} else pass("setEntities preserves location/connections");

const rawA = JSON.parse(store.get("camp-a-scene-meta"))["demo-scene"];
if (Object.prototype.hasOwnProperty.call(rawA, "locationId") || Object.prototype.hasOwnProperty.call(rawA, "connections")) {
  fail("setEntities should not snapshot unrelated overrides");
} else pass("setEntities stores entities override only");

store.clear();
SceneMeta.setConnections("camp-b", "demo-scene", [{ sceneId: "other" }], section);
const afterConn = SceneMeta.get("camp-b", "demo-scene", section);
if (
  afterConn.locationId !== "dragons-rest" ||
  !afterConn.entities.some((e) => e.id === "runara") ||
  afterConn.connections.length !== 1 ||
  afterConn.connections[0].sceneId !== "other"
) {
  fail("setConnections preserves location/entities");
} else pass("setConnections preserves location/entities");

store.clear();
SceneMeta.setLocationId("camp-c", "demo-scene", "beach-harbor", section);
const afterLoc = SceneMeta.get("camp-c", "demo-scene", section);
if (
  afterLoc.locationId !== "beach-harbor" ||
  !afterLoc.entities.some((e) => e.id === "runara") ||
  !afterLoc.connections.some((c) => c.sceneId === "next-scene")
) {
  fail("setLocationId preserves entities/connections");
} else pass("setLocationId preserves entities/connections");

/* ── Explicit clears ──────────────────────────────────── */

store.clear();
SceneMeta.setEntities("camp-d", "demo-scene", [], section);
SceneMeta.setConnections("camp-d", "demo-scene", [], section);
SceneMeta.setLocationId("camp-d", "demo-scene", "", section);
const cleared = SceneMeta.get("camp-d", "demo-scene", section);
if (cleared.entities.length !== 0 || cleared.connections.length !== 0 || cleared.locationId !== "") {
  fail("explicit empty overrides clear defaults");
} else pass("explicit empty overrides clear defaults");

/* ── Legacy full-snapshot storage still loads ─────────── */

store.clear();
store.set(
  "legacy-camp-scene-meta",
  JSON.stringify({
    "demo-scene": {
      locationId: "seagrow-caves",
      entities: [{ id: "zombie", type: "monster", quantity: 3 }],
      connections: [{ sceneId: "old-next", from: "demo-scene" }],
      updatedAt: 1
    }
  })
);
const legacy = SceneMeta.get("legacy-camp", "demo-scene", section);
if (legacy.locationId !== "seagrow-caves") fail("legacy locationId");
else pass("legacy locationId");
if (!legacy.entities.some((e) => e.id === "zombie" && e.quantity === 3 && !("type" in e))) {
  fail("legacy entities normalize");
} else pass("legacy entities normalize");
if (!legacy.connections.some((c) => c.sceneId === "old-next" && !("from" in c))) {
  fail("legacy connections normalize");
} else pass("legacy connections normalize");

/* ── add/remove only touch entities ───────────────────── */

store.clear();
SceneMeta.addEntity("camp-e", "demo-scene", { id: "undead-fortitude", note: "Radiant bypass" }, section);
const afterAdd = SceneMeta.get("camp-e", "demo-scene", section);
if (!afterAdd.entities.some((e) => e.id === "undead-fortitude") || afterAdd.locationId !== "dragons-rest") {
  fail("addEntity");
} else pass("addEntity");

const rawE = JSON.parse(store.get("camp-e-scene-meta"))["demo-scene"];
if (Object.prototype.hasOwnProperty.call(rawE, "locationId")) fail("addEntity polluted locationId");
else pass("addEntity does not pollute locationId");

SceneMeta.removeEntity("camp-e", "demo-scene", "runara", null, section);
const afterRemove = SceneMeta.get("camp-e", "demo-scene", section);
if (afterRemove.entities.some((e) => e.id === "runara")) fail("removeEntity");
else pass("removeEntity");

/* Defaults unchanged on a fresh campaign */
store.clear();
const fresh = SceneMeta.get("fresh-camp", "demo-scene", section);
if (!fresh.entities.some((e) => e.id === "runara") || fresh.locationId !== "dragons-rest") {
  fail("defaults not mutated");
} else pass("defaults not mutated");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll scene-meta runtime checks passed");
