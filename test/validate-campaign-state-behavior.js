/**
 * Behavioral checks for CampaignState using a localStorage shim.
 * Run: powershell -File test/validate-campaign-state-behavior.ps1
 * Or:  node test/validate-campaign-state-behavior.js (if Node available)
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

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

const sandbox = {
  window: {},
  localStorage,
  console,
  Date,
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  Boolean
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/core/campaign-state.js"), "utf8"), sandbox);

const CS = sandbox.window.CampaignState;
CS.init("test-campaign");

CS.setSceneStatus("meeting", "current");
CS.setSceneNotes("meeting", "Players arrive hungry.");
if (CS.getCurrentSceneId() !== "meeting") fail("current scene not set");
else pass("sets current scene");

CS.setSceneStatus("later", "current");
if (CS.getSceneState("meeting").status !== "completed") fail("previous current not demoted");
else pass("demotes previous current to completed");
if (CS.getCurrentSceneId() !== "later") fail("new current missing");
else pass("single current scene");

CS.updateNpcMemory("tarak", {
  attitude: "Friendly",
  mood: "Guarded",
  lastSeenLocation: "dragons-rest",
  lastSeenSession: 2,
  notes: ["Knows about dreams"],
  flags: ["Has not revealed secret"]
});

const mem = CS.getNpcMemory("tarak");
if (mem.attitude !== "Friendly" || mem.mood !== "Guarded") fail("npc memory fields");
else pass("npc memory stored");

CS.logInteraction({
  entityId: "tarak",
  session: 2,
  locationId: "dragons-rest",
  sceneId: "npc-tarak-varnoth",
  text: "Asked about tattoos. Tarak became guarded.",
  attitude: "Indifferent",
  mood: "Guarded"
});

const tl = CS.getTimeline({ type: "interaction" });
if (!tl.length || !tl[0].text.includes("tattoos")) fail("timeline interaction missing");
else pass("timeline interaction logged");

const mem2 = CS.getNpcMemory("tarak");
if (mem2.attitude !== "Indifferent") fail("interaction did not update attitude");
else pass("interaction updates memory");
if (!mem2.notes.some((n) => n.includes("tattoos"))) fail("interaction note not appended");
else pass("interaction appended to memory notes");

const raw = JSON.parse(localStorage.getItem("test-campaign-campaign-state"));
if (!raw.scenes || !raw.npcMemory || !raw.timeline) fail("persisted shape incomplete");
else pass("persisted under campaign namespace");

// Second campaign isolation
CS.init("other-campaign");
if (CS.getCurrentSceneId()) fail("other campaign contaminated");
else pass("campaign namespaces isolated");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll campaign-state behavior checks passed.");
