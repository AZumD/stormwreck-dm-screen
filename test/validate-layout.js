/**
 * Validates sidebar/map layout wiring and CSS rules.
 * Run: node test/validate-layout.js
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

const appJs = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const layoutJs = fs.readFileSync(path.join(root, "js/core/layout-panels.js"), "utf8");
const mapJs = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");

if (!html.includes("layout-panels.js")) fail("campaign HTML missing layout-panels.js");
else pass("layout-panels.js included in campaign page");

if (!layoutJs.includes("document.addEventListener(\"click\", handleClick)"))
  fail("layout-panels.js missing delegated click handler");
else pass("layout-panels uses delegated click handling");

if (!layoutJs.includes("app.style.setProperty(\"--nav-col\""))
  fail("layout-panels.js missing inline nav column updates");
else pass("layout-panels sets --nav-col on .app");

if (!layoutJs.includes("MAP_EXPANDED_WIDTH"))
  fail("layout-panels.js missing expanded map width");
else pass("layout-panels defines expanded map width");

if (!layoutJs.includes("setMapMode") || !layoutJs.includes('"combat"') || !layoutJs.includes('"workspace"'))
  fail("layout-panels.js missing map mode API (sidebar|expanded|combat|workspace)");
else pass("layout-panels exposes map mode API");

if (!layoutJs.includes("setCampaignWorkspace"))
  fail("layout-panels.js missing setCampaignWorkspace");
else pass("layout-panels setCampaignWorkspace");

if (!appJs.includes('activeWorkspace = "run"') || !appJs.includes("workspace-map") || !appJs.includes("CampaignWorkspace"))
  fail("campaign-app missing Map workspace wiring");
else pass("campaign-app Map workspace");

if (!mapJs.includes("onWorkspaceChange"))
  fail("map-panel missing onWorkspaceChange");
else pass("map-panel onWorkspaceChange");

if (!html.includes('id="workspace-map"') || html.includes('id="map-panel-toggle"'))
  fail("campaign should use Map workspace switcher (no map-panel-toggle)");
else pass("Map workspace switcher replaces map-panel-toggle");

if (!css.includes("map-mode-workspace"))
  fail("CSS missing map-mode-workspace");
else pass("CSS map-mode-workspace");

if (appJs.includes("function initSidebar")) fail("campaign-app.js still owns sidebar init");
else pass("sidebar init moved out of campaign-app.js");

if (mapJs.includes("setPanelCollapsed")) fail("map-panel.js still owns collapse logic");
else pass("map collapse moved out of map-panel.js");

if (!html.includes("map-expand-btn") || !html.includes('data-map-tab="party"'))
  fail("campaign HTML missing expand control / Party tab");
else pass("campaign HTML has expand + Party tab");

if (!css.includes("grid-template-columns: var(--nav-col"))
  fail("CSS missing grid layout with nav column variable");
else pass("CSS uses grid columns for layout");

if (!css.includes("body[data-nav-collapsed=\"true\"]"))
  fail("CSS missing data-attribute nav collapse fallback");
else pass("CSS has data-attribute collapse fallback");

if (!css.includes("aspect-ratio: var(--map-aspect") || /map-mode-expanded[\s\S]{0,200}aspect-ratio:\s*auto/.test(css))
  fail("CSS map stage must use --map-aspect and not stretch with aspect-ratio: auto when expanded");
else pass("CSS map stage preserves --map-aspect on expand");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll layout checks passed.");
