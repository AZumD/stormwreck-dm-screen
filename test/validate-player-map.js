/**
 * Player map + fog + single-map PC placement checks.
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

const playerMap = require(path.join(root, "server/lib/player-map.js"));

try {
  const mapState = {
    partyPositions: {
      "pc:pc-a": { mapId: "dragons-rest", x: 10, y: 20 }
    },
    tokens: {
      "seagrow-caves": [
        { id: "tok-pc-zz-1", kind: "pc", catalogueId: "pc-a", x: 1, y: 2 }
      ],
      "dragons-rest": [
        { id: "tok-pc-aa-1", kind: "pc", catalogueId: "pc-a", x: 3, y: 4 }
      ]
    }
  };
  const loc = playerMap.findPcLocation(mapState, "pc-a");
  assert.ok(loc);
  assert.strictEqual(loc.mapId, "dragons-rest");
  pass("findPcLocation prefers partyPositions map when duplicate tokens");
} catch (err) {
  fail(`findPcLocation: ${err.message}`);
}

try {
  const mapState = {
    partyPositions: { "pc:pc-b": { mapId: "map-b", x: 5, y: 6 } },
    tokens: {}
  };
  const loc = playerMap.findPcLocation(mapState, "pc-b");
  assert.strictEqual(loc.mapId, "map-b");
  assert.deepStrictEqual(loc.percent, { x: 5, y: 6 });
  pass("findPcLocation falls back to partyPositions");
} catch (err) {
  fail(`partyPositions fallback: ${err.message}`);
}

const placementSrc = fs.readFileSync(path.join(root, "js/core/map-pc-placement.js"), "utf8");
if (!placementSrc.includes("placePcOnMap") || !placementSrc.includes("normalizeDuplicates")) {
  fail("map-pc-placement missing core helpers");
} else pass("map-pc-placement module");

const fogSrc = fs.readFileSync(path.join(root, "js/core/map-fog.js"), "utf8");
if (!fogSrc.includes("normalized") && !fogSrc.includes("0, 1")) fail("map-fog should use normalized coords");
else pass("map-fog normalized strokes");

const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!apiSrc.includes("map-view") || !apiSrc.includes("playerMap")) fail("api missing player map routes");
else pass("player map API routes");

const playerApp = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
if (!playerApp.includes('data-tab="map"') && !playerApp.includes('"map"')) {
  /* tab is in html */
}
if (!playerApp.includes("renderMapTab") || !playerApp.includes("PlayerMapView")) {
  fail("player-app missing Map tab wiring");
} else pass("player Map tab");

const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
if (!playerHtml.includes('data-tab="map"')) fail("player index missing Map tab");
else pass("player index Map tab");

const spatial = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
if (!spatial.includes("MapPcPlacement") || !spatial.includes("map-fog-btn")) {
  fail("map-spatial missing placement/fog integration");
} else pass("DM fog + placement hooks");

for (const doc of [
  "docs/README/MAP-PC-PLACEMENT.md",
  "docs/README/MAP-FOG.md",
  "docs/README/PLAYER-MAP.md",
  "docs/README/VALIDATE-PLAYER-MAP.md"
]) {
  if (!fs.existsSync(path.join(root, doc))) fail(`missing ${doc}`);
  else pass(`doc ${doc}`);
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll player map checks passed.");
