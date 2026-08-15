/**
 * CampaignRegistry + landing create-campaign wiring.
 * Run: node test/validate-campaign-registry.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

const registrySrc = read("js/core/campaign-registry.js");
const landingSrc = read("js/landing.js");
const adventureSrc = read("js/campaigns/sandbox/adventure.js");
const indexHtml = read("index.html");
const sandboxHtml = read("campaigns/sandbox/index.html");
const entityUi = read("js/core/entity-ui.js");
const campaignApp = read("js/campaign-app.js");

if (!indexHtml.includes("create-campaign-btn") || !indexHtml.includes("campaign-registry.js")) {
  fail("landing missing create campaign UI wiring");
} else pass("landing create campaign markup");

if (indexHtml.includes("Coming soon") && indexHtml.includes("card-placeholder")) {
  fail("placeholder Coming soon card still present");
} else pass("placeholder campaign card removed");

if (!landingSrc.includes("CampaignRegistry.create") || !landingSrc.includes("sandboxUrl")) {
  fail("landing.js missing create/open flow");
} else pass("landing.js create flow");

if (!sandboxHtml.includes("campaign-registry.js") || !sandboxHtml.includes("sandbox/adventure.js")) {
  fail("sandbox shell missing registry/adventure scripts");
} else pass("sandbox shell scripts");

if (!adventureSrc.includes("CampaignRegistry") || !adventureSrc.includes("Opening")) {
  fail("sandbox adventure missing registry load / Opening scene");
} else pass("sandbox adventure shell");

if (!entityUi.includes("compact: true") || !entityUi.includes("!compact && entity.summary")) {
  fail("EntityUI map pins should use compact tooltips without summary");
} else pass("compact map pin tooltips");

if (!campaignApp.includes("syncCampaignChrome")) {
  fail("campaign-app should sync sidebar title from ADVENTURE.meta");
} else pass("campaign chrome sync");

/* Runtime registry */
const store = new Map();
const sandbox = {
  window: {},
  console,
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  }
};
sandbox.window = sandbox;
vm.runInNewContext(registrySrc, sandbox);

(async () => {
  const CR = sandbox.window.CampaignRegistry;
  if (!CR) {
    fail("CampaignRegistry not defined");
  } else {
    pass("CampaignRegistry defined");

    const a = await CR.create({ title: "Coastal Hex", description: "Test" });
    if (!a || a.id !== "coastal-hex" || a.title !== "Coastal Hex") fail("create slug/title failed");
    else pass("create campaign");

    const again = await CR.create({ title: "Coastal Hex" });
    if (!again || again.id !== "coastal-hex-2") fail("unique id collision handling failed");
    else pass("unique campaign ids");

    const storm = await CR.create({ title: "Stormwreck Isle" });
    if (!storm || storm.id === "stormwreck-isle") fail("must not reuse stormwreck-isle id");
    else pass("reserve stormwreck-isle id");

    if (CR.list().length < 3) fail("list missing entries");
    else pass("list campaigns");

    if (!CR.get(a.id) || CR.get("missing")) fail("get lookup wrong");
    else pass("get campaign");

    const url = CR.sandboxUrl(a.id);
    if (!url.includes("campaigns/sandbox/index.html") || !url.includes(`id=${a.id}`)) {
      fail("sandboxUrl shape wrong");
    } else pass("sandboxUrl");

    await CR.update(a.id, { description: "Updated" });
    if (CR.get(a.id).description !== "Updated") fail("update failed");
    else pass("update campaign");

    if (!(await CR.remove(again.id)) || CR.get(again.id)) fail("remove failed");
    else pass("remove campaign");
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll campaign-registry checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
