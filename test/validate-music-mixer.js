/**
 * Campaign music mixer: doc kind, modules, Map|Party|Music tabs, reorder helpers.
 * Run: node test/validate-music-mixer.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const fsp = require("fs/promises");
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

const idsSrc = fs.readFileSync(path.join(root, "server/lib/ids.js"), "utf8");
const mixerStateSrc = fs.readFileSync(path.join(root, "js/core/campaign-music-mixer.js"), "utf8");
const mixerUiSrc = fs.readFileSync(path.join(root, "js/core/music-mixer-ui.js"), "utf8");
const mapPanel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const campaignApp = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const stormHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const sandboxHtml = fs.readFileSync(path.join(root, "campaigns/sandbox/index.html"), "utf8");

if (!idsSrc.includes('"music-mixer"')) fail("ids.js missing music-mixer doc kind");
else pass("music-mixer in CAMPAIGN_DOC_KINDS");

if (!mixerStateSrc.includes("CampaignMusicMixer") || !mixerStateSrc.includes("reorderTracks")) {
  fail("campaign-music-mixer.js incomplete");
} else pass("campaign-music-mixer.js");

if (!mixerUiSrc.includes("MusicMixerUi") || !mixerUiSrc.includes("getMusicPlayback") || !mixerUiSrc.includes("music-mixer-track__handle") || !mixerUiSrc.includes("pointerdown")) {
  fail("music-mixer-ui.js incomplete");
} else pass("music-mixer-ui.js");

if (!mixerUiSrc.includes("pauseAll") || !mixerUiSrc.includes("data-music-pause-all") || !mixerUiSrc.includes("is-playing")) {
  fail("music-mixer-ui missing Pause all / playing badge");
} else pass("music-mixer-ui Pause all + playing badge");

if (!mixerUiSrc.includes("expiresAt") || !mixerUiSrc.includes("expiresIn")) {
  fail("music-mixer-ui missing signed URL refresh");
} else pass("music-mixer-ui signed URL refresh");

if (!mixerUiSrc.includes("data-loop") || !mixerUiSrc.includes("slot.loop")) {
  fail("music-mixer-ui missing loop toggle");
} else pass("music-mixer-ui loop toggle");

if (!mapPanel.includes('"music"') || !mapPanel.includes("MusicMixerUi")) {
  fail("map-panel.js missing music tab wiring");
} else pass("map-panel music tab");

if (!campaignApp.includes("CampaignMusicMixer.bootstrap") || !campaignApp.includes("MusicMixerUi.init")) {
  fail("campaign-app.js missing mixer bootstrap/init");
} else pass("campaign-app mixer bootstrap");

if (!css.includes(".music-mixer-track") || !css.includes(".music-mixer-add")) {
  fail("style.css missing mixer styles");
} else pass("mixer CSS");

for (const [label, html] of [
  ["stormwreck", stormHtml],
  ["sandbox", sandboxHtml]
]) {
  if (!html.includes('data-map-tab="music"') || !html.includes('id="music-mixer-list"')) {
    fail(`${label} missing Music tab markup`);
  } else pass(`${label} Music tab markup`);
  if (!html.includes("campaign-music-mixer.js") || !html.includes("music-mixer-ui.js")) {
    fail(`${label} missing mixer scripts`);
  } else pass(`${label} mixer scripts`);
  if (!html.includes('id="music-mixer-dialog"')) fail(`${label} missing add-music dialog`);
  else pass(`${label} add-music dialog`);
}

(async () => {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-mixer-"));
  const prev = process.env.DM_DATA_ROOT;
  process.env.DM_DATA_ROOT = tmp;

  Object.keys(require.cache).forEach((key) => {
    if (key.replace(/\\/g, "/").includes("/server/lib/")) delete require.cache[key];
  });

  const { assertDocKind, CAMPAIGN_DOC_KINDS } = require("../server/lib/ids");
  try {
    assertDocKind("music-mixer");
    pass("assertDocKind music-mixer");
  } catch (err) {
    fail(`assertDocKind music-mixer: ${err.message}`);
  }
  if (!CAMPAIGN_DOC_KINDS.includes("music-mixer")) fail("CAMPAIGN_DOC_KINDS export");
  else pass("CAMPAIGN_DOC_KINDS export includes music-mixer");

  const { ensureDataLayout } = require("../server/lib/atomic-fs");
  const campaigns = require("../server/lib/campaigns");
  await ensureDataLayout();

  const campaignId = "mixer-test-camp";
  const doc = {
    tracks: [
      { id: "mx-a", catalogueMusicId: "music-1", title: "Rain", volume: 0.4, loop: true, order: 1 },
      { id: "mx-b", catalogueMusicId: "music-2", title: "Battle", volume: 0.8, loop: false, order: 0 }
    ]
  };
  await campaigns.putDocument(campaignId, "music-mixer", doc);
  const loaded = await campaigns.getDocument(campaignId, "music-mixer");
  if (!loaded?.tracks || loaded.tracks.length !== 2) fail("put/get music-mixer document");
  else pass("put/get music-mixer document");

  const sandbox = {
    window: {},
    console,
    Date,
    Math,
    String,
    Number,
    Array,
    Object,
    Map,
    JSON,
    localStorage: {
      _d: Object.create(null),
      getItem(k) {
        return this._d[k] ?? null;
      },
      setItem(k, v) {
        this._d[k] = String(v);
      }
    }
  };
  sandbox.window = sandbox;
  sandbox.LocalApiClient = {
    isAvailable: () => false,
    ready: async () => true
  };
  vm.runInNewContext(mixerStateSrc, sandbox);
  const CampaignMusicMixer = sandbox.CampaignMusicMixer || sandbox.window.CampaignMusicMixer;
  if (!CampaignMusicMixer) {
    fail("CampaignMusicMixer not defined in vm");
  } else {
    await CampaignMusicMixer.bootstrap(campaignId);
    CampaignMusicMixer.addTrack(campaignId, {
      catalogueMusicId: "music-rain",
      title: "Rain",
      volume: 0.5,
      loop: true
    });
    CampaignMusicMixer.addTrack(campaignId, {
      catalogueMusicId: "music-battle",
      title: "Battle",
      volume: 0.9,
      loop: false
    });
    let tracks = CampaignMusicMixer.sortedTracks(campaignId);
    if (tracks.length < 2) fail("addTrack");
    else pass("addTrack");

    const idsOrder = tracks.map((t) => t.id).reverse();
    CampaignMusicMixer.reorderTracks(campaignId, idsOrder);
    tracks = CampaignMusicMixer.sortedTracks(campaignId);
    if (tracks[0].id !== idsOrder[0] || tracks[1].id !== idsOrder[1]) fail("reorderTracks");
    else pass("reorderTracks");

    CampaignMusicMixer.updateTrack(campaignId, tracks[0].id, { volume: 0.25 });
    tracks = CampaignMusicMixer.sortedTracks(campaignId);
    if (Math.abs(tracks[0].volume - 0.25) > 0.001) fail("updateTrack volume");
    else pass("updateTrack volume");

    const before = tracks.length;
    CampaignMusicMixer.removeTrack(campaignId, tracks[0].id);
    if (CampaignMusicMixer.sortedTracks(campaignId).length !== before - 1) fail("removeTrack");
    else pass("removeTrack");
  }

  if (prev === undefined) delete process.env.DM_DATA_ROOT;
  else process.env.DM_DATA_ROOT = prev;
  await fsp.rm(tmp, { recursive: true, force: true });

  if (failed) {
    console.error(`\n${failed} music mixer check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll music mixer checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
