/**
 * Chronicle store + UI wiring checks.
 * Run: node test/validate-chronicle.js
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

const storeSrc = read("js/core/chronicle-store.js");
const uiSrc = read("js/core/chronicle-ui.js");
const app = read("js/campaign-app.js");
const html = read("campaigns/stormwreck-isle/index.html");
const histUi = read("js/core/campaign-state-ui.js");

if (!storeSrc.includes("window.ChronicleStore") || !storeSrc.includes("-chronicle")) fail("ChronicleStore missing");
else pass("ChronicleStore module");

if (storeSrc.includes("-campaign-state")) fail("Chronicle must not write CampaignState storage");
else pass("Chronicle storage is separate");

if (!uiSrc.includes("renderChroniclePanel") || !uiSrc.includes("storySoFar")) fail("ChronicleUI panel missing");
else pass("ChronicleUI panel");

if (!uiSrc.includes("markdownLite") || !uiSrc.includes("entity-link")) fail("Chronicle prose/wiki links missing");
else pass("Chronicle wiki links");

if (!app.includes('case "chronicle"') || !app.includes("ChronicleUI.init")) fail("campaign-app chronicle wiring");
else pass("campaign-app Chronicle panel");

if (!html.includes('data-view="session"') || !html.includes("chronicle-store.js") || !html.includes("key-event-dialog")) {
  fail("campaign HTML chronicle wiring");
} else pass("campaign HTML Chronicle");
if (!histUi.includes("data-promote-history") || !histUi.includes("promoteHistoryEntry")) {
  fail("History promote missing");
} else pass("History Make Key Event");

const storeMap = new Map();
const sandbox = {
  window: {},
  console,
  localStorage: {
    getItem: (k) => (storeMap.has(k) ? storeMap.get(k) : null),
    setItem: (k, v) => storeMap.set(k, String(v))
  }
};
vm.createContext(sandbox);
vm.runInContext(storeSrc, sandbox);
const ChronicleStore = sandbox.window.ChronicleStore;
ChronicleStore.init("demo-camp");

ChronicleStore.setStorySoFar("Astrid arrived on Stormwreck Isle.");
if (ChronicleStore.getStorySoFar() !== "Astrid arrived on Stormwreck Isle.") fail("story so far persist");
else pass("story so far persist");

const s3 = ChronicleStore.upsertSession({ session: 3, title: "A Quiet Evening", content: "We returned @npc:gideon|Gideon." });
if (!s3 || ChronicleStore.getSession(3).title !== "A Quiet Evening") fail("session upsert");
else pass("session upsert");

const next = ChronicleStore.suggestNextSessionNumber(3);
if (next !== 4) fail("suggest next session");
else pass("suggest next session");

const ke = ChronicleStore.upsertKeyEvent({
  session: 3,
  title: "Gideon reveals his past",
  type: "revelation",
  importance: "major",
  entityIds: ["gideon"],
  locationId: "dragons-rest",
  sceneId: "inhabitants"
});
if (!ke?.id || ChronicleStore.listKeyEvents({ session: 3 }).length !== 1) fail("key event upsert");
else pass("key event upsert");

const gideonEvents = ChronicleStore.listKeyEvents({ entityId: "gideon" });
if (!gideonEvents.some((e) => e.title.includes("Gideon"))) fail("filter by entity");
else pass("filter by entity");

const hist = ChronicleStore.fromHistoryEntry({
  id: "tl-1",
  session: 3,
  text: "Met Runara",
  sceneId: "inhabitants",
  locationId: "dragons-rest",
  entityId: "runara"
});
if (!hist.sourceHistoryId || hist.entityIds[0] !== "runara") fail("fromHistoryEntry");
else pass("fromHistoryEntry");

if (storeMap.has("demo-camp-campaign-state")) fail("must not touch campaign-state key");
else pass("campaign-state untouched");

if (!storeMap.get("demo-camp-chronicle").includes("Story So Far") && !storeMap.get("demo-camp-chronicle").includes("Astrid")) {
  fail("chronicle blob missing story");
} else pass("chronicle blob stored");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll chronicle checks passed");
