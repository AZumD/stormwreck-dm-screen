/**
 * Validates map↔catalogue bridge, pin drag storage hooks, and YouTube media wiring.
 * Run: node test/validate-maps-media.js
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

function loadGlobal(file, globalName) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  const fn = new Function(code + `\nreturn ${globalName};`);
  return fn();
}

const mapPanel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const mediaBar = fs.readFileSync(path.join(root, "js/core/media-bar.js"), "utf8");
const parser = fs.readFileSync(path.join(root, "js/core/parser.js"), "utf8");
const campaignHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const maps = loadGlobal("js/campaigns/stormwreck-isle/maps.js", "MAPS");

if (!mapPanel.includes("resolveMapImage")) fail("map-panel missing catalogue image resolve");
else pass("map-panel resolves catalogue mapImage");

if (!mapPanel.includes("pin-positions")) fail("map-panel missing pin position storage");
else pass("map-panel persists pin positions");

if (!mapPanel.includes("map-pin--dragging")) fail("map-panel missing drag class");
else pass("map-panel supports pin dragging");

if (!mediaBar.includes("youtube-nocookie.com/embed")) fail("media-bar missing youtube embed");
else pass("media-bar embeds youtube");

if (!parser.includes("YOUTUBE_RE") && !parser.includes("youtube:")) fail("parser missing youtube syntax");
else pass("parser supports {{youtube:…}}");

if (!campaignHtml.includes("media-bar")) fail("campaign missing media bar markup");
else pass("campaign has media bar");

if (!campaignHtml.includes("media-bar.js")) fail("campaign missing media-bar.js");
else pass("campaign loads media-bar.js");

if (!campaignHtml.includes("map-source-hint")) fail("campaign missing map source hint");
else pass("campaign shows map source hint");

for (const map of Object.values(maps)) {
  if (!map.locationId) fail(`map ${map.id} missing locationId`);
}
pass("all maps declare locationId");

/* extractYouTubeId smoke */
const extract = new Function(`
  ${mediaBar}
  return MediaBar.extractYouTubeId;
`)();

const samples = [
  ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"]
];

for (const [input, expected] of samples) {
  const got = extract(input);
  if (got !== expected) fail(`extractYouTubeId(${input}) => ${got}, expected ${expected}`);
}
pass("extractYouTubeId parses common URL forms");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll maps/media checks passed.");
