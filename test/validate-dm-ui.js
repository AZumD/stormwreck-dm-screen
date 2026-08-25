/**
 * Validates DM UI cleanup: Map|Party|Music tabs, expand mode shell, Layers popover,
 * collapsible map settings, compact ambience strip + dock.
 * Run: node test/validate-dm-ui.js
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

const layoutJs = fs.readFileSync(path.join(root, "js/core/layout-panels.js"), "utf8");
const mapJs = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const spatialJs = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
const mediaJs = fs.readFileSync(path.join(root, "js/core/media-bar.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const stormHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const sandboxHtml = fs.readFileSync(path.join(root, "campaigns/sandbox/index.html"), "utf8");

for (const [label, html] of [
  ["stormwreck", stormHtml],
  ["sandbox", sandboxHtml]
]) {
  if (!html.includes('data-map-tab="map"') || !html.includes('data-map-tab="party"') || !html.includes('data-map-tab="music"')) {
    fail(`${label} missing Map|Party|Music tabs`);
  } else pass(`${label} has Map|Party|Music tabs`);

  if (!html.includes("map-primary-actions") || !html.includes("map-layers-btn") || !html.includes("map-expand-btn")) {
    fail(`${label} missing primary map actions`);
  } else pass(`${label} has primary map actions`);

  if (!html.includes("map-layers-popover") || !html.includes('id="map-filters"')) {
    fail(`${label} missing Layers popover / filters`);
  } else pass(`${label} has Layers popover`);

  if (!html.includes('id="map-settings"') || !html.includes("location-katalog")) {
    fail(`${label} missing collapsible map settings / Location catalogue link`);
  } else pass(`${label} has map settings`);

  if (html.includes("party-section") && html.includes('data-map-tab-panel="party"')) {
    pass(`${label} party lives on Party tab`);
  } else fail(`${label} party tab panel missing`);

  if (!html.includes("media-bar__strip") || !html.includes("media-bar-mixer") || !html.includes("media-bar-pause-all")) {
    fail(`${label} missing compact ambience strip controls`);
  } else pass(`${label} has ambience strip`);

  if (!html.includes('id="media-dock"') || !html.includes("media-bar-frames")) {
    fail(`${label} missing separate media dock`);
  } else pass(`${label} has separate media dock`);
}

if (!layoutJs.includes('setMapMode') || !layoutJs.includes('"sidebar"') || !layoutJs.includes('"expanded"') || !layoutJs.includes('"combat"')) {
  fail("layout-panels missing mapPanel.mode sidebar|expanded|combat");
} else pass("layout-panels defines sidebar|expanded|combat modes");

if (!layoutJs.includes("toggleMapExpanded") || !layoutJs.includes("map-expand-btn")) {
  fail("layout-panels missing expand wiring");
} else pass("layout-panels wires expand control");

if (!mapJs.includes("setActiveTab") || !mapJs.includes("map-layers-popover")) {
  fail("map-panel missing tabs / layers popover logic");
} else pass("map-panel has tabs + layers popover");

if (!spatialJs.includes("map-settings-body") || !spatialJs.includes("els.measureBtn.hidden")) {
  fail("map-spatial should demote settings and gate Measure/Token visibility");
} else pass("map-spatial splits primary vs settings chrome");

if (!mediaJs.includes("pauseAll") || !mediaJs.includes("setTrackVolume") || !mediaJs.includes("onLayoutChange")) {
  fail("media-bar missing mixer / volume / layout API");
} else pass("media-bar mixer + volume + layout API");

if (!mediaJs.includes("wantPlay") || !mediaJs.includes("resumeAll")) {
  fail("media-bar must keep multi-track resume semantics");
} else pass("media-bar keeps multi-track resume");

const bannedHide = [
  /media-dock[\s\S]{0,400}display:\s*none[\s\S]{0,200}iframe/i,
  /media-bar__player[\s\S]{0,200}opacity:\s*0/i,
  /media-bar__frame[\s\S]{0,120}width:\s*1px/i
];
for (const re of bannedHide) {
  if (re.test(css)) fail(`CSS may hide YouTube players unsafely: ${re}`);
}
pass("CSS avoids classic YouTube-hiding patterns on players");

if (!css.includes("map-mode-expanded") || !css.includes("map-primary-actions") || !css.includes("media-bar__strip")) {
  fail("CSS missing expanded mode / primary actions / ambience strip");
} else pass("CSS has expanded mode + strip styles");

if (!mapJs.includes("syncMapAspect") || !mapJs.includes("--map-aspect")) {
  fail("map-panel must sync --map-aspect from image natural size");
} else pass("map-panel syncs --map-aspect");

if (/body\.map-mode-expanded\s+\.map-stage[\s\S]{0,280}aspect-ratio:\s*auto/.test(css)) {
  fail("expanded .map-stage must not use aspect-ratio: auto");
} else pass("expanded map stage keeps aspect ratio");

if (!css.includes("media-dock") || !css.includes("--media-player-size")) {
  fail("CSS missing adaptive media dock sizing");
} else pass("CSS has adaptive media dock");

/* Concurrent multi-track regression checklist (static guarantees) */
const checklist = [
  [mediaJs.includes("YT.Player"), "IFrame API players"],
  [mediaJs.includes("resumeAll"), "sibling resume"],
  [mediaJs.includes("volume"), "per-track volume"],
  [mediaJs.includes("pauseVideo"), "intentional pause (not destroy)"],
  [mediaJs.includes("onLayoutChange"), "layout change hook"],
  [!/host\.style\.display\s*=\s*['\"]none['\"]/.test(mediaJs), "no display:none on player hosts in JS"]
];
for (const [ok, label] of checklist) {
  if (!ok) fail(`multi-track checklist: ${label}`);
}
pass("multi-track regression checklist wired");

const docs = [
  "docs/README/MAP-PANEL.md",
  "docs/README/MEDIA-BAR.md",
  "docs/README/LAYOUT-PANELS.md",
  "docs/README/MAP-SPATIAL.md"
];
for (const d of docs) {
  if (!fs.existsSync(path.join(root, d))) fail(`missing ${d}`);
}
pass("DM UI docs present");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll DM UI checks passed.");
