/**
 * Static checks for campaign ↔ location catalogue wiring.
 * Run: node test/validate-campaign-locations.js
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
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const ids = read("server/lib/ids.js");
const api = read("server/routes/api.js");
const catMaps = read("server/lib/catalogue-location-maps.js");
const campaignLocs = read("js/core/campaign-locations.js");
const campaignLocsUi = read("js/core/campaign-locations-ui.js");
const mapPanel = read("js/core/map-panel.js");
const configs = read("js/core/catalogue/configs.js");
const client = read("js/core/local-api-client.js");
const isle = read("campaigns/stormwreck-isle/index.html");

if (!ids.includes('"locations"')) fail("CAMPAIGN_DOC_KINDS missing locations");
else pass("locations doc kind");

if (!catMaps.includes("importUvtt") || !catMaps.includes("getFullMap")) {
  fail("catalogue-location-maps module incomplete");
} else pass("catalogue-location-maps");

if (!api.includes("/uvtt") || !api.includes("catalogueLocationMaps")) {
  fail("API missing catalogue UVTT routes");
} else pass("catalogue UVTT API routes");

if (!campaignLocs.includes("CampaignLocations") || !campaignLocs.includes("locationIds")) {
  fail("CampaignLocations module missing");
} else pass("CampaignLocations");

if (!campaignLocsUi.includes("Add location") || !campaignLocsUi.includes("data-remove-location")) {
  fail("CampaignLocationsUI incomplete");
} else pass("CampaignLocationsUI");

if (!mapPanel.includes("CampaignLocations") || !mapPanel.includes("locationEntryToMapDef")) {
  fail("MapPanel must filter maps by campaign locations");
} else pass("MapPanel campaign location maps");

if (!mapPanel.includes("Add location") || !mapPanel.includes("__add_location__")) {
  fail("MapPanel map dropdown missing Add location option");
} else pass("MapPanel Add location dropdown");

if (!campaignLocsUi.includes("onAdded")) {
  fail("CampaignLocationsUI openPicker should support onAdded callback");
} else pass("CampaignLocationsUI onAdded callback");

if (!configs.includes('type: "uvtt"') || !configs.includes("mapCalibration")) {
  fail("Location catalogue config missing UVTT field");
} else pass("Location UVTT catalogue field");

if (!client.includes("importLocationUvtt") || !client.includes("getLocationUvttMap")) {
  fail("LocalApiClient missing location UVTT helpers");
} else pass("LocalApiClient location UVTT");

if (!client.includes("patchLocationUvtt") || !catMaps.includes("patchCalibration")) {
  fail("Location UVTT display PATCH missing");
} else pass("Location UVTT PATCH");

if (!isle.includes("campaign-locations.js") || !isle.includes("campaign-location-picker")) {
  fail("Campaign HTML must load campaign locations modules");
} else pass("Campaign HTML scripts");

const backLinks = [
  "campaigns/stormwreck-isle/index.html",
  "location-katalog/index.html"
].map((f) => read(f));
backLinks.forEach((html, i) => {
  if (!html.includes('href="/dm/">← DM Library')) fail(`back link ${i} not pointing to /dm/`);
  else pass(`DM Library back link ${i}`);
});

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll campaign location checks passed");
