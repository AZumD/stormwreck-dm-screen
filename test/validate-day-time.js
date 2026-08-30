/**
 * Validates campaign-time compact control + CampaignState.clock persistence.
 * Run: node test/validate-day-time.js
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

const stateCode = fs.readFileSync(path.join(root, "js/core/campaign-state.js"), "utf8");
const uiCode = fs.readFileSync(path.join(root, "js/core/day-time-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const appCode = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");

if (!stateCode.includes("getClock") || !stateCode.includes("setClock") || !stateCode.includes("normalizeClock")) {
  fail("CampaignState missing clock API");
} else {
  pass("CampaignState clock API");
}

if (!uiCode.includes("DayTimeUI") || !uiCode.includes("day-time-day") || !uiCode.includes("day-time-minute")) {
  fail("DayTimeUI missing");
} else {
  pass("DayTimeUI module");
}

if (!uiCode.includes("campaign-time-trigger") || !uiCode.includes("campaign-time-popover")) {
  fail("DayTimeUI missing compact trigger/popover");
} else {
  pass("DayTimeUI compact trigger/popover");
}

if (!uiCode.includes("PRESETS") || !uiCode.includes("8 * 60") || !uiCode.includes("22 * 60")) {
  fail("DayTimeUI missing time presets");
} else {
  pass("DayTimeUI time presets");
}

if (!uiCode.includes("pointerdown") || !uiCode.includes("Escape")) {
  fail("DayTimeUI missing dismiss handlers");
} else {
  pass("DayTimeUI dismiss via Escape/outside");
}

if (!uiCode.includes("positionPopover") || !uiCode.includes('.position = "fixed"')) {
  fail("DayTimeUI popover must use fixed viewport positioning");
} else {
  pass("DayTimeUI fixed popover positioning");
}

if (!css.includes(".campaign-time__slider--time") || !css.includes("#c9a227")) {
  fail("campaign-time slider / noon yellow missing");
} else {
  pass("campaign-time slider CSS");
}

if (css.includes(".day-time-bar {") || css.includes(".day-time-bar__slider")) {
  fail("obsolete day-time-bar styles still present");
} else {
  pass("obsolete day-time-bar styles removed");
}

if (!css.includes(".main-chrome")) fail("main-chrome sticky wrapper missing");
else pass("main-chrome sticky wrapper");

if (!appCode.includes("DayTimeUI.init")) fail("campaign-app does not init DayTimeUI");
else pass("campaign-app inits DayTimeUI");

for (const page of ["campaigns/stormwreck-isle/index.html", "campaigns/sandbox/index.html"]) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  if (html.includes('id="day-time-bar"')) {
    fail(`${page} still has persistent day-time-bar`);
  } else if (!html.includes('id="campaign-time"') || !html.includes("campaign-time-trigger") || !html.includes("day-time-ui.js")) {
    fail(`${page} missing campaign-time control`);
  } else if (!html.includes('max="10"') || !html.includes('max="1439"') || !html.includes('step="1"')) {
    fail(`${page} missing tenday/time ranges`);
  } else if (!html.includes('data-time-preset="noon"') || !html.includes('data-minute="720"')) {
    fail(`${page} missing time presets`);
  } else if (!html.includes("main-chrome")) {
    fail(`${page} missing main-chrome`);
  } else {
    pass(`${page} compact campaign-time`);
  }
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
vm.runInContext(stateCode, sandbox);
const CS = sandbox.window.CampaignState;

(async () => {
  await CS.init("test-clock-campaign");
  const def = CS.getClock();
  if (def.day !== 1 || def.minute !== 480) fail(`unexpected default clock ${JSON.stringify(def)}`);
  else pass("default clock Day 1 / 08:00");

  CS.setClock({ day: 7, minute: 720 });
  const noon = CS.getClock();
  if (noon.day !== 7 || noon.minute !== 720) fail("setClock failed");
  else pass("setClock persists in memory");

  if (CS.formatClockTime(0) !== "00:00" || CS.formatClockTime(1439) !== "23:59") {
    fail("formatClockTime wrong");
  } else pass("formatClockTime");

  CS.setClock({ day: 2, minute: 875 });
  const raw = localStorage.getItem("test-clock-campaign-campaign-state");
  const parsed = JSON.parse(raw);
  if (!parsed.clock || parsed.clock.day !== 2 || parsed.clock.minute !== 875) {
    fail("clock not persisted to localStorage");
  } else pass("clock persists to localStorage");

  await CS.init("other-clock-campaign");
  const other = CS.getClock();
  if (other.day !== 1 || other.minute !== 480) fail("campaign clock isolation broken");
  else pass("campaign clock isolation");

  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll day-time checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
