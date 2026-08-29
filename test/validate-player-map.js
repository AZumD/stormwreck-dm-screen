/**
 * Player map + fog + canonical partyPositions PC placement checks.
 * Run: node test/validate-player-map.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
let failed = 0;

function pass(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

const placement = require(path.join(root, "server/lib/map-pc-placement.js"));
const playerMap = require(path.join(root, "server/lib/player-map.js"));

/* partyPositions canonical — stale token on wrong map ignored */
try {
  const mapState = {
    partyPositions: { "pc:pc-a": { mapId: "dragons-rest", x: 10, y: 20 } },
    tokens: {
      "seagrow-caves": [{ id: "tok-pc-zz-1", kind: "pc", catalogueId: "pc-a", x: 1, y: 2 }]
    }
  };
  const loc = placement.findCanonicalPcLocation(mapState, "pc-a");
  assert.strictEqual(loc.mapId, "dragons-rest");
  assert.deepStrictEqual(loc.percent, { x: 10, y: 20 });
  assert.strictEqual(loc.token, undefined);
  pass("canonical location ignores stale token on map B");
} catch (err) {
  fail(`stale token ignored: ${err.message}`);
}

/* duplicate tokens — normalize removes non-canonical map token */
try {
  const before = {
    partyPositions: { "pc:pc-a": { mapId: "map-a", x: 1, y: 2 } },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: 3, y: 4 }],
      "map-b": [{ id: "tok-pc-bb-1", kind: "pc", catalogueId: "pc-a", x: 5, y: 6 }]
    }
  };
  const after = placement.normalizePcMapState(before);
  assert.strictEqual(after.partyPositions["pc:pc-a"].mapId, "map-a");
  assert.ok(!after.tokens["map-b"].some((t) => t.catalogueId === "pc-a"));
  assert.strictEqual(after.tokens["map-a"].filter((t) => t.catalogueId === "pc-a").length, 1);
  pass("normalize removes stale token on map B");
} catch (err) {
  fail(`normalize stale: ${err.message}`);
}

/* moving PC A does not affect PC B */
try {
  const before = {
    partyPositions: {
      "pc:pc-a": { mapId: "map-a", x: 1, y: 2 },
      "pc:pc-b": { mapId: "map-b", x: 5, y: 6 }
    },
    tokens: {
      "map-a": [{ id: "tok-a", kind: "pc", catalogueId: "pc-a", x: 1, y: 2 }],
      "map-b": [{ id: "tok-b", kind: "pc", catalogueId: "pc-b", x: 5, y: 6 }]
    }
  };
  const moved = {
    ...before,
    partyPositions: {
      "pc:pc-a": { mapId: "map-c", x: 9, y: 9 },
      "pc:pc-b": { mapId: "map-b", x: 5, y: 6 }
    },
    tokens: {
      "map-a": [],
      "map-b": [{ id: "tok-b", kind: "pc", catalogueId: "pc-b", x: 5, y: 6 }],
      "map-c": [{ id: "tok-a", kind: "pc", catalogueId: "pc-a", x: 9, y: 9 }]
    }
  };
  const norm = placement.normalizePcMapState(moved);
  assert.strictEqual(norm.partyPositions["pc:pc-b"].mapId, "map-b");
  assert.ok(norm.tokens["map-b"].some((t) => t.catalogueId === "pc-b"));
  assert.ok(!norm.tokens["map-a"]?.some((t) => t.catalogueId === "pc-a"));
  pass("PC A move does not affect PC B");
} catch (err) {
  fail(`PC B isolation: ${err.message}`);
}

/* removing PC — no canonical location */
try {
  const mapState = { partyPositions: {}, tokens: {} };
  const loc = placement.findCanonicalPcLocation(mapState, "pc-gone");
  assert.strictEqual(loc, null);
  pass("removed PC has no canonical location");
} catch (err) {
  fail(`removed PC: ${err.message}`);
}

/* normalize promotes legacy token-only state to partyPositions */
try {
  const before = {
    partyPositions: {},
    tokens: {
      "legacy-map": [{ id: "tok-pc-legacy-1", kind: "pc", catalogueId: "pc-old", x: 2, y: 3 }]
    }
  };
  const after = placement.normalizePcMapState(before);
  assert.strictEqual(after.partyPositions["pc:pc-old"].mapId, "legacy-map");
  pass("legacy token-only migrates to partyPositions");
} catch (err) {
  fail(`legacy migrate: ${err.message}`);
}

/* player map endpoint uses canonical location */
try {
  const mapState = {
    partyPositions: { "pc:pc-a": { mapId: "dragons-rest", x: 10, y: 20 } },
    tokens: {
      "seagrow-caves": [{ id: "tok-pc-zz-1", kind: "pc", catalogueId: "pc-a", x: 1, y: 2 }]
    }
  };
  const loc = playerMap.findCanonicalPcLocation(mapState, "pc-a");
  assert.strictEqual(loc.mapId, "dragons-rest");
  pass("player map resolution uses partyPositions");
} catch (err) {
  fail(`player resolution: ${err.message}`);
}

/* reload invariant — normalize idempotent */
try {
  const state = {
    partyPositions: { "pc:pc-a": { mapId: "map-a", x: 1, y: 2 } },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: 3, y: 4 }]
    }
  };
  const once = placement.normalizePcMapState(state);
  const twice = placement.normalizePcMapState(once);
  assert.deepStrictEqual(once.partyPositions, twice.partyPositions);
  assert.deepStrictEqual(once.tokens, twice.tokens);
  pass("normalize is idempotent after reload");
} catch (err) {
  fail(`idempotent: ${err.message}`);
}

const placementSrc = fs.readFileSync(path.join(root, "js/core/map-pc-placement.js"), "utf8");
if (placementSrc.includes("Token on a map wins")) {
  fail("client still uses token-first lookup");
} else pass("client uses partyPositions-first lookup");
if (!placementSrc.includes("findPcLocation") || !placementSrc.includes("normalizePcMapState")) {
  fail("client missing canonical helpers");
} else pass("client canonical helpers");

const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!apiSrc.includes("map-view") || !apiSrc.includes("playerMap")) fail("api missing player map routes");
else pass("player map API routes");

const playerApp = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
if (!playerApp.includes("renderMapTab") || !playerApp.includes("PlayerMapView")) {
  fail("player-app missing Map tab wiring");
} else pass("player Map tab");

for (const doc of [
  "docs/README/MAP-PC-PLACEMENT.md",
  "docs/README/MAP-FOG.md",
  "docs/README/PLAYER-MAP.md",
  "docs/README/VALIDATE-PLAYER-MAP.md"
]) {
  if (!fs.existsSync(path.join(root, doc))) fail(`missing ${doc}`);
  else pass(`doc ${doc}`);
}

const spatialSrc = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
if (!spatialSrc.includes("setFogPaintActive") || !spatialSrc.includes("map-fog-hint")) {
  fail("map-spatial missing fog paint mode UX");
} else pass("map-spatial auto-activates fog paint mode");

const mapPanelSrc = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
if (!mapPanelSrc.includes('getElementById("map-fog-btn")')) {
  fail("map-panel should block pan while fog paint is active");
} else pass("map-panel blocks pan during fog paint");

/* player map tokens — visible combat tokens on same map */
try {
  const mapMeta = {
    calibrated: true,
    widthPx: 1000,
    heightPx: 700,
    grid: { pixelsPerGrid: 256, origin: { x: 0, y: 0 }, sizeX: 10, sizeY: 10 }
  };
  const mapState = {
    partyPositions: {
      "pc:pc-a": { mapId: "map-a", x: 10, y: 20 },
      "pc:pc-b": { mapId: "map-a", x: 40, y: 50 }
    },
    tokens: {
      "map-a": [
        { id: "t-mon", kind: "monster", label: "Goblin", x: 5, y: 5, visible: true, gridCells: 1 },
        { id: "t-pc", kind: "pc", catalogueId: "pc-a", label: "Hero", x: 3, y: 4, visible: true, gridCells: 1 },
        { id: "t-npc", kind: "npc", label: "Vendor", x: 7, y: 8, visible: true, gridCells: 1 },
        { id: "t-hidden", kind: "monster", label: "Hidden", x: 1, y: 1, visible: false, gridCells: 1 }
      ]
    }
  };
  const pcLookup = new Map([["pc-b", { name: "Ally", portrait_url: null }]]);
  const tokens = playerMap.buildPlayerMapTokens(mapState, "map-a", "pc-a", mapMeta, pcLookup);
  assert.strictEqual(tokens.filter((t) => t.kind === "monster").length, 1);
  assert.ok(tokens.some((t) => t.kind === "npc" && t.label === "Vendor"));
  assert.ok(tokens.some((t) => t.isSelf && t.label === "Hero"));
  assert.ok(tokens.some((t) => t.kind === "pc" && t.label === "Ally"));
  assert.ok(!tokens.some((t) => t.label === "Hidden"));
  pass("player map tokens include visible pcs/npcs/monsters");
} catch (err) {
  fail(`player map tokens: ${err.message}`);
}

const playerMapViewSrc = fs.readFileSync(path.join(root, "js/core/player-map-view.js"), "utf8");
if (!playerMapViewSrc.includes("player-map-zoom-in") || !playerMapViewSrc.includes("player-map-tokens")) {
  fail("player-map-view missing zoom chrome or token layer");
} else pass("player map view has zoom + token layer");

if (!spatialSrc.includes("onFogKeydown") || !spatialSrc.includes("undoFogStroke")) {
  fail("map-spatial missing fog ctrl+z undo");
} else pass("map-spatial binds fog ctrl+z undo");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll player map checks passed.");
