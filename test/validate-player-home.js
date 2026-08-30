/**
 * Player Home composition — next session summary, schedule subview, hierarchy.
 * Run: node test/validate-player-home.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
const playerApp = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
const schedUi = fs.readFileSync(path.join(root, "js/player-scheduling.js"), "utf8");
const playerCss = fs.readFileSync(path.join(root, "css/player.css"), "utf8");
const platformCss = fs.readFileSync(path.join(root, "css/player-platform.css"), "utf8");

if (!playerHtml.includes('id="player-view-home"') || !playerHtml.includes('id="player-view-schedule"')) {
  fail("player html missing home/schedule subviews");
} else pass("player home + schedule subviews");

if (!playerHtml.includes('id="home-next-session"') || !playerHtml.includes('id="player-schedule-list"')) {
  fail("player html missing next session summary or schedule list host");
} else pass("next session + schedule list hosts");

if (playerHtml.includes('id="home-schedule-list"')) {
  fail("full calendar should not remain embedded in home markup");
} else pass("no inline home-schedule-list");

if (!playerHtml.includes("player-atmosphere")) {
  fail("player html missing fixed atmosphere layer");
} else pass("player atmosphere layer");

if (
  !playerHtml.includes("player-schedule-back") ||
  (!playerHtml.includes('data-player-view="schedule"') && !schedUi.includes('data-player-view="schedule"'))
) {
  fail("schedule navigation triggers missing");
} else pass("schedule navigation triggers");

{
  const nextIdx = playerHtml.indexOf("home-next-session");
  const charIdx = playerHtml.indexOf("home-character");
  const boardIdx = playerHtml.indexOf("home-board-list");
  const campIdx = playerHtml.indexOf("campaign-list");
  if (nextIdx < 0 || charIdx < 0 || boardIdx < 0 || campIdx < 0) {
    fail("player home missing primary sections");
  } else if (!(nextIdx < charIdx && charIdx < boardIdx && boardIdx < campIdx)) {
    fail("player home order must be Next session → Character → Board → Campaigns");
  } else pass("player home section order");
}

if (!playerApp.includes("setPlayerHomeView") || !playerApp.includes("readPlayerHomeViewFromUrl")) {
  fail("player-app missing home view navigation");
} else pass("player-app view navigation");

if (!playerApp.includes("renderCharacterHomeSection") || !playerApp.includes("home-character-spotlight")) {
  fail("player-app missing character spotlight");
} else pass("player-app character spotlight");

if (!schedUi.includes("renderNextSessionSummary") || !schedUi.includes("pickNextSessionEvent")) {
  fail("player-scheduling missing next session summary");
} else pass("player-scheduling next session summary");

if (!schedUi.includes("data-player-view")) {
  fail("player-scheduling should link to schedule subview");
} else pass("scheduling schedule subview links");

if (!playerCss.includes(".player-atmosphere") || !playerCss.includes("background-repeat: no-repeat")) {
  fail("player.css missing non-tiling atmosphere");
} else pass("player.css atmosphere (no repeat)");

if (!platformCss.includes(".home-surface") || !platformCss.includes(".home-next-session")) {
  fail("player-platform.css missing home surface styles");
} else pass("player-platform home surfaces");

if (!fs.existsSync(path.join(root, "docs/README/VALIDATE-PLAYER-HOME.md"))) {
  fail("missing docs/README/VALIDATE-PLAYER-HOME.md");
} else pass("VALIDATE-PLAYER-HOME.md present");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll player home checks passed.");
