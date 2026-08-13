/**
 * Validates party roster wiring (no hardcoded placeholders).
 * Run: node test/validate-party.js
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const partyCore = read("js/core/party.js");
const partyStub = read("js/campaigns/stormwreck-isle/party.js");
const state = read("js/core/campaign-state.js");
const app = read("js/campaign-app.js");
const html = read("campaigns/stormwreck-isle/index.html");
const mapPanel = read("js/core/map-panel.js");

if (!partyCore.includes("window.PartyRoster") || !partyCore.includes("addPartyMember")) {
  fail("PartyRoster module missing");
} else {
  pass("PartyRoster module");
}

if (partyStub.includes("Amelia") || partyStub.includes("pc-cleric")) {
  fail("placeholder PCs still in campaign party.js");
} else {
  pass("placeholder PCs removed");
}

if (!state.includes("getParty") || !state.includes("removePartyMember")) {
  fail("CampaignState missing party API");
} else {
  pass("CampaignState party API");
}

if (!app.includes("PartyRoster.init")) fail("campaign-app missing PartyRoster.init");
else pass("campaign-app inits PartyRoster");

if (!html.includes("js/core/party.js") || !html.includes("party-dialog")) {
  fail("campaign HTML missing party script/dialog");
} else {
  pass("campaign HTML party wiring");
}

if (!mapPanel.includes("PartyRoster") || !mapPanel.includes('memberType !== "npc"')) {
  fail("map-panel not using PartyRoster / PC filter");
} else {
  pass("map-panel party integration");
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll party checks passed");
