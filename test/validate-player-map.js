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
const mapDistance = require(path.join(root, "server/lib/map-distance.js"));
const playerMap = require(path.join(root, "server/lib/player-map.js"));

const calibratedMap = {
  id: "map-a",
  widthPx: 1000,
  heightPx: 700,
  grid: { pixelsPerGrid: 100, origin: { x: 0, y: 0 }, sizeX: 10, sizeY: 10 }
};

function resolveCalibratedMap(mapId) {
  return mapId === "map-a" || mapId === calibratedMap.id ? calibratedMap : null;
}

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

/* reload invariant — topology normalize is idempotent; coords handled separately */
try {
  const state = {
    partyPositions: { "pc:pc-a": { mapId: "map-a", x: 1, y: 2 } },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: 3, y: 4 }]
    }
  };
  const once = placement.normalizePcMapState(state);
  assert.strictEqual(once.tokens["map-a"][0].x, 3);
  assert.strictEqual(once.tokens["map-a"][0].y, 4);
  const twice = placement.normalizePcMapState(once);
  assert.deepStrictEqual(once.partyPositions, twice.partyPositions);
  assert.deepStrictEqual(once.tokens, twice.tokens);
  pass("normalize topology is idempotent without map calibration");
} catch (err) {
  fail(`idempotent topology: ${err.message}`);
}

/* calibrated: matching world token is not overwritten with party percent values */
try {
  const canonical = { mapId: "map-a", x: 40, y: 60 };
  const world = mapDistance.percentToWorld(canonical.x, canonical.y, calibratedMap);
  assert.ok(world, "expected world coords from percent");
  const state = {
    partyPositions: { "pc:pc-a": canonical },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: world.x, y: world.y }]
    }
  };
  const topo = placement.normalizePcMapState(state);
  const synced = placement.syncPcTokenWorldCoords(topo, { resolveMap: resolveCalibratedMap });
  assert.strictEqual(synced.tokens["map-a"][0].x, world.x);
  assert.strictEqual(synced.tokens["map-a"][0].y, world.y);
  const again = placement.syncPcTokenWorldCoords(
    placement.normalizePcMapState(synced),
    { resolveMap: resolveCalibratedMap }
  );
  assert.deepStrictEqual(synced.tokens, again.tokens);
  pass("calibrated PC token keeps world coords when already canonical");
} catch (err) {
  fail(`calibrated preserve world: ${err.message}`);
}

/* calibrated: stale world token repairs to percentToWorld(canonical) */
try {
  const canonical = { mapId: "map-a", x: 40, y: 60 };
  const expected = mapDistance.percentToWorld(canonical.x, canonical.y, calibratedMap);
  const before = {
    partyPositions: { "pc:pc-a": canonical },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: 99, y: 99 }]
    }
  };
  const synced = placement.syncPcTokenWorldCoords(placement.normalizePcMapState(before), {
    resolveMap: resolveCalibratedMap
  });
  assert.strictEqual(synced.tokens["map-a"][0].x, expected.x);
  assert.strictEqual(synced.tokens["map-a"][0].y, expected.y);
  pass("calibrated stale world token syncs from canonical percent");
} catch (err) {
  fail(`calibrated stale world sync: ${err.message}`);
}

/* bootstrap without map defs must not write percent into token world fields */
try {
  const canonical = { mapId: "map-a", x: 40, y: 60 };
  const world = mapDistance.percentToWorld(canonical.x, canonical.y, calibratedMap);
  const before = {
    partyPositions: { "pc:pc-a": canonical },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: world.x, y: world.y }]
    }
  };
  const topo = placement.normalizePcMapState(before);
  const noMaps = placement.syncPcTokenWorldCoords(topo, { resolveMap: () => null });
  assert.strictEqual(noMaps.tokens["map-a"][0].x, world.x);
  assert.strictEqual(noMaps.tokens["map-a"][0].y, world.y);
  pass("coord sync skipped safely when map calibration unavailable");
} catch (err) {
  fail(`bootstrap without maps: ${err.message}`);
}

/* drag round-trip: world -> percent canonical -> reload normalize -> same world */
try {
  const movedWorld = { x: 8, y: 12 };
  const percent = mapDistance.worldToPercent(movedWorld.x, movedWorld.y, calibratedMap);
  assert.ok(percent, "expected percent from moved world");
  const before = {
    partyPositions: { "pc:pc-a": { mapId: "map-a", x: percent.x, y: percent.y } },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: movedWorld.x, y: movedWorld.y }]
    }
  };
  const reloaded = placement.syncPcTokenWorldCoords(placement.normalizePcMapState(before), {
    resolveMap: resolveCalibratedMap
  });
  assert.strictEqual(reloaded.tokens["map-a"][0].x, movedWorld.x);
  assert.strictEqual(reloaded.tokens["map-a"][0].y, movedWorld.y);
  pass("drag round-trip survives normalize + coord sync");
} catch (err) {
  fail(`drag round-trip: ${err.message}`);
}

/* repeated coord sync must not churn tokens (no repeated PATCH payload) */
try {
  const canonical = { mapId: "map-a", x: 40, y: 60 };
  const world = mapDistance.percentToWorld(canonical.x, canonical.y, calibratedMap);
  const state = {
    partyPositions: { "pc:pc-a": canonical },
    tokens: {
      "map-a": [{ id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: world.x, y: world.y }]
    }
  };
  const opts = { resolveMap: resolveCalibratedMap };
  const once = placement.syncPcTokenWorldCoords(placement.normalizePcMapState(state), opts);
  const twice = placement.syncPcTokenWorldCoords(placement.normalizePcMapState(once), opts);
  assert.strictEqual(Object.keys(placement.tokensPatchFromNormalize(once.tokens, twice.tokens)).length, 0);
  assert.deepStrictEqual(once.tokens, twice.tokens);
  pass("repeated coord sync is idempotent (no token PATCH churn)");
} catch (err) {
  fail(`coord sync idempotent: ${err.message}`);
}

const placementSrc = fs.readFileSync(path.join(root, "js/core/map-pc-placement.js"), "utf8");
if (placementSrc.includes("Token on a map wins")) {
  fail("client still uses token-first lookup");
} else pass("client uses partyPositions-first lookup");
if (!placementSrc.includes("syncPcTokenWorldCoords") || placementSrc.includes("syncTokenToCanonicalCoords")) {
  fail("client must use coordinate-space-aware syncPcTokenWorldCoords");
} else pass("client coordinate-space-aware token sync");
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

const playerMapViewSrc = fs.readFileSync(path.join(root, "js/core/player-map-view.js"), "utf8");
if (!playerMapViewSrc.includes("player-map-zoom-in") || !playerMapViewSrc.includes("player-map-tokens")) {
  fail("player-map-view missing zoom chrome or token layer");
} else pass("player map view has zoom + token layer");

if (playerMapViewSrc.includes("player-map-center-btn") || playerMapViewSrc.includes("player-map-fit-btn")) {
  fail("player-map-view still has Center on me / Fit controls");
} else pass("player map has no Center on me / Fit");

if (
  playerMapViewSrc.includes("viewportsByMapId") ||
  playerMapViewSrc.includes("saveViewport") ||
  playerMapViewSrc.includes("restoreViewport")
) {
  fail("player-map-view still persists pan/zoom viewports by map");
} else pass("player map does not persist pan offsets");

if (playerMapViewSrc.includes("dragging") || playerMapViewSrc.includes("dragStart")) {
  fail("player-map-view still has free-pan drag state");
} else pass("player map has no free-pan drag");

if (!playerMapViewSrc.includes("centerOnSelf") || !playerMapViewSrc.includes("setZoomCenteredOnPc")) {
  fail("player-map-view missing PC-centered camera helpers");
} else pass("player map PC-centered camera helpers");

if (!playerMapViewSrc.includes("sessionZoom") || !playerMapViewSrc.includes("ResizeObserver")) {
  fail("player-map-view missing session zoom or resize recenter");
} else pass("player map session zoom + resize recenter");

if (!playerMapViewSrc.includes("selfMoved") || !playerMapViewSrc.includes("selfPositionKey")) {
  fail("player-map-view should recenter when PC moves even if revision is unchanged");
} else pass("player map follows PC position changes");

if (!playerMapViewSrc.includes("PlayerMapCamera") || !playerMapViewSrc.includes("bindZoomGestures")) {
  fail("player-map-view must use PlayerMapCamera and zoom-only gestures");
} else pass("player map uses shared camera module + zoom gestures");

if (!playerMapViewSrc.includes("translate(-50%, -50%)") || playerMapViewSrc.includes("margin: `calc(-")) {
  fail("player-map-view tokens must center with translate, not broken margin calc");
} else pass("player map tokens center with translate(-50%, -50%)");

const playerMapCamera = require(path.join(root, "js/core/player-map-camera.js"));
try {
  assert.ok(playerMapCamera.PLAYER_MAP_MIN_ZOOM > 1, "min zoom must be > 1 (no full-map fit)");
  assert.ok(playerMapCamera.PLAYER_MAP_MAX_ZOOM > playerMapCamera.PLAYER_MAP_MIN_ZOOM);
  assert.ok(
    playerMapCamera.PLAYER_MAP_DEFAULT_ZOOM >= playerMapCamera.PLAYER_MAP_MIN_ZOOM &&
      playerMapCamera.PLAYER_MAP_DEFAULT_ZOOM <= playerMapCamera.PLAYER_MAP_MAX_ZOOM
  );
  assert.strictEqual(playerMapCamera.clampZoom(0.5), playerMapCamera.PLAYER_MAP_MIN_ZOOM);
  assert.strictEqual(playerMapCamera.clampZoom(99), playerMapCamera.PLAYER_MAP_MAX_ZOOM);
  assert.strictEqual(playerMapCamera.clampZoom(2), 2);
  pass("player map zoom limits clamp correctly");
} catch (err) {
  fail(`zoom limits: ${err.message}`);
}

try {
  const pan = playerMapCamera.computeCenterPan({ x: 25, y: 50 }, 400, 200, 800, 600, 2);
  assert.strictEqual(pan.panX, 800 / 2 - 100 * 2);
  assert.strictEqual(pan.panY, 600 / 2 - 100 * 2);
  const pan2 = playerMapCamera.computeCenterPan({ x: 50, y: 50 }, 400, 400, 400, 400, 2);
  assert.strictEqual(pan2.panX, 200 - 200 * 2);
  assert.strictEqual(pan2.panY, 200 - 200 * 2);
  pass("computeCenterPan places PC at viewport center");
} catch (err) {
  fail(`computeCenterPan: ${err.message}`);
}

try {
  const p1 = playerMapCamera.computeCenterPan({ x: 10, y: 20 }, 1000, 700, 500, 400, 2);
  const p2 = playerMapCamera.computeCenterPan({ x: 40, y: 60 }, 1000, 700, 500, 400, 2);
  assert.notStrictEqual(p1.panX, p2.panX);
  assert.notStrictEqual(p1.panY, p2.panY);
  const z1 = playerMapCamera.computeCenterPan({ x: 40, y: 60 }, 1000, 700, 500, 400, 2);
  const z2 = playerMapCamera.computeCenterPan({ x: 40, y: 60 }, 1000, 700, 500, 400, 3);
  assert.notStrictEqual(z1.panX, z2.panX);
  pass("recentering updates when PC moves or zoom changes");
} catch (err) {
  fail(`recenter deltas: ${err.message}`);
}

if (!playerMapViewSrc.includes("player-map-stale") || !playerMapViewSrc.includes("setStaleBanner")) {
  fail("player-map-view missing poll stale/retrying indicator");
} else pass("player map stale poll indicator");

if (!playerMapViewSrc.includes("tokenSpan") || !playerMapViewSrc.includes("player-map-token--round")) {
  fail("player-map-view missing DM-aligned grid token sizing");
} else pass("player map view uses grid-aligned token sizing");

const playerCss = fs.readFileSync(path.join(root, "css/player.css"), "utf8");
if (!playerCss.includes("player-map-token--has-img") || !playerCss.includes("object-fit: contain")) {
  fail("player.css missing frameless token art styling");
} else pass("player map tokens render frameless when art is present");

if (!playerCss.includes("cursor: default") || playerCss.includes("cursor: grab")) {
  fail("player map viewport should use default cursor (not grab)");
} else pass("player map viewport uses default cursor");

if (playerCss.includes(".player-map-world") && /player-map-world\s*\{[^}]*position:\s*absolute/s.test(playerCss)) {
  fail("player-map-world must stay in-flow (absolute collapses viewport height)");
} else pass("player map world stays in-flow for viewport sizing");

if (!playerCss.includes('data-active-tab="map"]') || !playerCss.includes("height: 100dvh")) {
  fail("map tab shell should fill viewport height for flex map layout");
} else pass("map tab shell fills viewport height");

const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
if (!playerHtml.includes("player-map-camera.js") || !playerHtml.includes("player-map-view.js")) {
  fail("player/index.html must load camera module before map view");
} else pass("player html loads map camera + view scripts");

for (const doc of [
  "docs/README/MAP-PC-PLACEMENT.md",
  "docs/README/MAP-FOG.md",
  "docs/README/PLAYER-MAP.md",
  "docs/README/PLAYER-MAP-CAMERA.md",
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
if (!mapPanelSrc.includes("MapPcPlacement?.normalizeDuplicates")) {
  fail("map-panel should re-normalize PC coords after maps are available");
} else pass("map-panel deferred PC coord sync");
if (!mapPanelSrc.includes('getElementById("map-fog-btn")')) {
  fail("map-panel should block pan while fog paint is active");
} else pass("map-panel blocks pan during fog paint");

if (!spatialSrc.includes("onFogKeydown") || !spatialSrc.includes("undoFogStroke")) {
  fail("map-spatial missing fog ctrl+z undo");
} else pass("map-spatial binds fog ctrl+z undo");

/* async player map token checks */
async function runAsyncPlayerMapTests() {
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
    const tokens = await playerMap.buildPlayerMapTokens(mapState, "map-a", "pc-a", mapMeta, pcLookup);
    assert.strictEqual(tokens.filter((t) => t.kind === "monster").length, 1);
    assert.ok(tokens.some((t) => t.kind === "npc" && t.label === "Vendor"));
    assert.ok(tokens.some((t) => t.isSelf && t.label === "Hero"));
    assert.ok(tokens.some((t) => t.kind === "pc" && t.label === "Ally"));
    assert.ok(!tokens.some((t) => t.label === "Hidden"));
    assert.ok(tokens.every((t) => t.spanW > 0 && t.spanH > 0));
    pass("player map tokens include visible pcs/npcs/monsters with grid span");
  } catch (err) {
    fail(`player map tokens: ${err.message}`);
  }

  try {
    const mapMeta = {
      calibrated: true,
      widthPx: 1000,
      heightPx: 700,
      grid: { pixelsPerGrid: 100, origin: { x: 0, y: 0 }, sizeX: 10, sizeY: 10 }
    };
    const mapState = {
      partyPositions: { "pc:pc-a": { mapId: "map-a", x: 10, y: 20 } },
      tokens: {
        "map-a": [
          {
            id: "t-pc-stale",
            kind: "pc",
            catalogueId: "pc-a",
            label: "Hero",
            x: 9,
            y: 9,
            visible: true,
            gridCells: 1
          }
        ]
      }
    };
    const tokens = await playerMap.buildPlayerMapTokens(
      mapState,
      "map-a",
      "pc-a",
      mapMeta,
      new Map([["pc-a", { name: "Hero" }]])
    );
    const self = tokens.find((t) => t.catalogueId === "pc-a");
    assert.ok(self, "expected PC token");
    assert.strictEqual(self.percent.x, 10);
    assert.strictEqual(self.percent.y, 20);
    pass("player map uses canonical partyPositions for PC coords on same map");
  } catch (err) {
    fail(`canonical PC coords on player map: ${err.message}`);
  }

  try {
    const mapMeta = {
      calibrated: true,
      widthPx: 1000,
      heightPx: 700,
      grid: { pixelsPerGrid: 100, origin: { x: 0, y: 0 }, sizeX: 10, sizeY: 10 }
    };
    const mapState = {
      partyPositions: { "pc:pc-a": { mapId: "dragons-rest", x: 10, y: 20 } },
      pinPositions: {
        "dragons-rest": {
          "p-tarak": { x: 30, y: 56 }
        }
      },
      tokens: {}
    };
    const tokens = await playerMap.buildPlayerMapTokens(
      mapState,
      "dragons-rest",
      "pc-a",
      mapMeta,
      new Map(),
      { campaignId: "stormwreck-isle", linkId: "dragons-rest" }
    );
    const tarak = tokens.find((t) => t.id === "p-tarak");
    assert.ok(tarak, "expected p-tarak pin");
    assert.strictEqual(tarak.kind, "npc");
    assert.strictEqual(tarak.percent.x, 30);
    pass("static NPC map pins appear on player map");
  } catch (err) {
    fail(`static NPC pins: ${err.message}`);
  }

  try {
    const mapFog = require(path.join(root, "server/lib/map-fog.js"));
    const fog = {
      enabled: true,
      revealedAll: false,
      strokes: [
        {
          id: "s1",
          seq: 1,
          mode: "reveal",
          radius: 0.05,
          points: [[0.5, 0.5]]
        }
      ]
    };
    assert.strictEqual(mapFog.isPointHidden(fog, 0.5, 0.5), false);
    assert.strictEqual(mapFog.isPointHidden(fog, 0.1, 0.1), true);
    const tokens = [
      { id: "self", isSelf: true, percent: { x: 10, y: 10 } },
      { id: "hidden", percent: { x: 10, y: 10 } },
      { id: "shown", percent: { x: 50, y: 50 } }
    ];
    const visible = mapFog.filterVisibleTokens(tokens, fog);
    assert.strictEqual(visible.length, 2);
    assert.ok(visible.some((t) => t.id === "self"));
    assert.ok(visible.some((t) => t.id === "shown"));
    pass("fog hides unrevealed tokens but keeps own PC");
  } catch (err) {
    fail(`fog token visibility: ${err.message}`);
  }
}

runAsyncPlayerMapTests().then(() => {
  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll player map checks passed.");
});
