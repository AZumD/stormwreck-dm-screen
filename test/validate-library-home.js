/**
 * DM Library home validation — Continue, Tools, workspace launch.
 * Run: node test/validate-library-home.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const html = fs.readFileSync(path.join(root, "dm/index.html"), "utf8");
const landingJs = fs.readFileSync(path.join(root, "js/landing.js"), "utf8");
const summaryJs = fs.readFileSync(path.join(root, "js/core/library-summary.js"), "utf8");
const campaignApp = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/landing.css"), "utf8");

if (!html.includes('id="library-continue"') || !html.includes('id="library-campaigns"')) {
  fail("DM Library missing Continue / campaigns hosts");
} else pass("Continue + campaigns sections");

if (!html.includes("library-tools") || !html.includes('href="compendium/"')) {
  fail("Tools section missing Compendium");
} else pass("Tools Compendium link");

if (!html.includes('href="/player/"') || !html.includes("Player App")) {
  fail("Tools missing Player App");
} else pass("Tools Player App");

if (!html.includes("#library-schedule") || !html.includes("library-next-session")) {
  fail("schedule summary + full schedule missing");
} else pass("schedule hierarchy");

if (!html.includes("Data &amp; backup") || !html.includes("import-browser-data")) {
  fail("utilities footer missing import/export");
} else pass("Data & backup utilities");

if (html.includes("NPC Catalogue") || html.includes("landing-sidebar")) {
  fail("old catalogue sidebar should be removed");
} else pass("no legacy catalogue sidebar");

if (!landingJs.includes("renderLibraryHome") || !landingJs.includes("renderContinueCard")) {
  fail("landing.js missing home renderers");
} else pass("landing.js home renderers");

if (!landingJs.includes('launchUrl(summary.url, "run")') || !landingJs.includes('launchUrl(summary.url, "prep")')) {
  fail("landing.js missing Run/Prep launch URLs");
} else pass("Run/Prep launch links");

if (!landingJs.includes("setLastOpened") || !landingJs.includes("LibrarySummary")) {
  fail("landing.js missing last-opened tracking");
} else pass("last-opened campaign tracking");

if (!summaryJs.includes("dm-last-campaign-id") || !summaryJs.includes("pickContinueDef")) {
  fail("library-summary.js incomplete");
} else pass("library-summary module");

if (!campaignApp.includes("readLaunchWorkspace") || !campaignApp.includes('get("workspace")')) {
  fail("campaign-app missing workspace query override");
} else pass("campaign workspace query override");

if (!campaignApp.includes("clearLaunchWorkspaceParam")) {
  fail("campaign-app should strip workspace query after launch");
} else pass("workspace query cleanup");

if (!css.includes(".library-continue-card") || !css.includes(".library-home-grid")) {
  fail("landing.css missing library home styles");
} else pass("library home CSS");

if (!html.includes("library-schedule-section--collapsed") || !html.includes('id="library-schedule-collapse"')) {
  fail("Schedule should be collapsible with collapse control");
} else pass("collapsible schedule shell");

if (!html.includes('id="library-schedule"') || !html.match(/id="library-schedule"[^>]*hidden/)) {
  fail("Schedule section should be hidden by default");
} else pass("schedule collapsed by default");

if (!html.includes("data-expand-schedule")) {
  fail("missing schedule expand triggers");
} else pass("schedule expand triggers");

if (!landingJs.includes("expandSchedule") || !landingJs.includes("collapseSchedule")) {
  fail("landing.js missing schedule expand/collapse");
} else pass("schedule expand/collapse logic");

if (!landingJs.includes("library-continue-card__main") || !landingJs.includes("landing-tool-btn--secondary")) {
  fail("Continue card missing composed layout / action hierarchy");
} else pass("Continue card layout");

if (!landingJs.includes("card-campaign__surface")) {
  fail("campaign cards missing surface panel");
} else pass("campaign card surfaces");

if (!html.includes("library-section-head") || !html.includes("library-new-campaign")) {
  fail("New campaign should live in Campaigns heading row");
} else pass("New campaign in Campaigns header");

const sandbox = { window: {}, console, localStorage: { _m: new Map(), getItem(k) { return this._m.get(k) ?? null; }, setItem(k, v) { this._m.set(k, v); } } };
vm.createContext(sandbox);
vm.runInContext(summaryJs, sandbox);
const helpers = sandbox.window.LibrarySummary._test;
if (helpers.currentSceneIdFromState({ scenes: { a: { status: "current" } } }) !== "a") {
  fail("currentSceneIdFromState");
} else pass("current scene from CampaignState shape");

if (!helpers.formatSessionLine({ session: "2" }, { day: 3, minute: 875 }).includes("Session 2")) {
  fail("formatSessionLine");
} else pass("session/time summary formatting");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll library home checks passed.");
