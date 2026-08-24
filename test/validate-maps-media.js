/**
 * Validates map↔catalogue bridge, pin drag storage hooks, and YouTube media wiring.
 * Run: node test/validate-maps-media.js
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

function loadGlobal(file, globalName) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  const sandbox = { window: {}, console };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox[globalName] || sandbox.window[globalName];
}

const mapPanel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const mediaBar = fs.readFileSync(path.join(root, "js/core/media-bar.js"), "utf8");
const parser = fs.readFileSync(path.join(root, "js/core/parser.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const campaignHtml = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");
const sandboxHtml = fs.readFileSync(path.join(root, "campaigns/sandbox/index.html"), "utf8");
const maps = loadGlobal("js/campaigns/stormwreck-isle/maps.js", "MAPS");

if (!mapPanel.includes("resolveMapImage")) fail("map-panel missing catalogue image resolve");
else pass("map-panel resolves catalogue mapImage");

if (!mapPanel.includes("pin-positions")) fail("map-panel missing pin position storage");
else pass("map-panel persists pin positions");

if (!mapPanel.includes("map-pin--dragging")) fail("map-panel missing drag class");
else pass("map-panel supports pin dragging");

if (!mediaBar.includes("youtube.com/embed") && !mediaBar.includes("iframe_api")) {
  fail("media-bar missing youtube embed / API");
} else pass("media-bar embeds youtube");

/* Must not attach list= to embeds — truncated playlists show "unavailable" */
if (mediaBar.includes('params.set("list"') || mediaBar.includes("list: list")) {
  fail("media-bar must not pass list= into embed URL");
} else pass("media-bar embed ignores playlist list=");


if (!parser.includes("YOUTUBE_RE") && !parser.includes("youtube:")) fail("parser missing youtube syntax");
else pass("parser supports {{youtube:…}}");

if (!parser.includes("data-media-url")) fail("parser chips should keep full media URL");
else pass("parser chips keep data-media-url");

if (css.includes("clip: rect(0 0 0 0)") && css.includes(".media-bar__frame-wrap")) {
  /* only fail if frame-wrap still uses the old 1px hide */
}
if (!css.includes("width: 200px") && !css.includes("--media-player-size")) {
  fail("media-bar CSS should use a visible player size (200px or --media-player-size)");
} else pass("media-bar CSS visible mini player");

if (css.match(/\.media-bar__frame-wrap[\s\S]*?clip:\s*rect\(0/) || css.match(/\.media-dock__frames[\s\S]*?clip:\s*rect\(0/)) {
  fail("media-bar frame-wrap must not be clipped to 0 (YouTube blocks autoplay)");
} else pass("media-bar frame not clipped");

if (!mediaBar.includes("stopTrack") || !mediaBar.includes("getTracks") || !mediaBar.includes("resumeAll")) {
  fail("media-bar missing multi-track API");
} else pass("media-bar multi-track API");

if (!mediaBar.includes("iframe_api") || !mediaBar.includes("YT.Player")) {
  fail("media-bar should use YouTube IFrame API for simultaneous play");
} else pass("media-bar uses YouTube IFrame API");

if (
  (!css.includes(".media-bar__tracks") && !css.includes(".media-bar__track")) ||
  !css.includes(".media-bar__player") ||
  (!css.includes("overflow-x: auto") && !css.includes("media-dock__frames"))
) {
  fail("media-bar CSS missing track list / visible player dock");
} else pass("media-bar CSS multi-track layout");


for (const [label, html] of [
  ["stormwreck", campaignHtml],
  ["sandbox", sandboxHtml]
]) {
  if (!html.includes("media-bar") || !html.includes("media-bar.js")) {
    fail(`${label} missing media bar`);
  }
  if (!html.includes("media-bar-tracks") || !html.includes("media-bar-frames")) {
    fail(`${label} missing multi-track media bar markup`);
  }
  if (!html.includes("media-dock") || !html.includes("media-bar-mixer")) {
    fail(`${label} missing media dock / mixer`);
  }
  if (html.includes('loading="lazy"') && html.includes("media-bar-frame")) {
    fail(`${label} media iframe should not use loading=lazy`);
  }
}
pass("campaign pages have multi-track media bar");


for (const map of Object.values(maps)) {
  if (!map.locationId) fail(`map ${map.id} missing locationId`);
}
pass("all maps declare locationId");

const sandbox = {
  window: {},
  console,
  URL,
  URLSearchParams,
  encodeURIComponent,
  requestAnimationFrame: (cb) => cb()
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(mediaBar, sandbox);
const MB = sandbox.window.MediaBar;

const samples = [
  ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ["https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDEM", "dQw4w9WgXcQ"],
  ["https://www.youtube.com/watch?v=LO3qLkzjg3w&list=PLWiOI6mkSdPg", "LO3qLkzjg3w"]
];

for (const [input, expected] of samples) {
  const got = MB.extractYouTubeId(input);
  if (got !== expected) fail(`extractYouTubeId(${input}) => ${got}, expected ${expected}`);
}
pass("extractYouTubeId parses common URL forms");

const embedSample = (() => {
  /* Rebuild expected shape from public API */
  const id = MB.extractYouTubeId(
    "https://www.youtube.com/watch?v=LO3qLkzjg3w&list=PLWiOI6mkSdPg"
  );
  return id === "LO3qLkzjg3w";
})();
if (!embedSample) fail("video id should still extract when list= is present");
else pass("video id extracted despite list= in URL");

/* Multi-track play/stop with a minimal DOM stub */
function el(tag, attrs = {}) {
  const node = {
    tagName: tag.toUpperCase(),
    attrs: { ...attrs },
    children: [],
    style: {
      setProperty(k, v) {
        this[k] = String(v);
      }
    },
    dataset: {},
    classList: {
      _s: new Set(String(attrs.class || "").split(/\s+/).filter(Boolean)),
      add(c) {
        this._s.add(c);
      },
      remove(c) {
        this._s.delete(c);
      },
      contains(c) {
        return this._s.has(c);
      },
      toggle(c, force) {
        if (force === true) this._s.add(c);
        else if (force === false) this._s.delete(c);
        else if (this._s.has(c)) this._s.delete(c);
        else this._s.add(c);
        return this._s.has(c);
      }
    },
    setAttribute(k, v) {
      this.attrs[k] = String(v);
    },
    getAttribute(k) {
      return this.attrs[k];
    },
    appendChild(child) {
      this.children.push(child);
      child.parent = this;
    },
    remove() {
      if (!this.parent) return;
      this.parent.children = this.parent.children.filter((c) => c !== this);
      this.parent = null;
    },
    addEventListener() {},
    querySelector(sel) {
      if (sel === ".media-bar__frame-wrap" || sel === ".media-dock__frames") {
        return this.children.find((c) => c.attrs?.id === "media-bar-frames" || c.classList.contains("media-bar__frame-wrap") || c.classList.contains("media-dock__frames"));
      }
      return null;
    },
    get hidden() {
      return this.attrs.hidden === true || this.attrs.hidden === "";
    },
    set hidden(v) {
      if (v) this.attrs.hidden = true;
      else delete this.attrs.hidden;
    },
    get innerHTML() {
      return this._html || "";
    },
    set innerHTML(v) {
      this._html = String(v);
      this.children = [];
    },
    get textContent() {
      return this._text || "";
    },
    set textContent(v) {
      this._text = String(v);
    },
    get src() {
      return this.attrs.src || "";
    },
    set src(v) {
      this.attrs.src = String(v);
    }
  };
  if (attrs.id) node.id = attrs.id;
  return node;
}

const bar = el("div", { id: "media-bar", class: "media-bar" });
const status = el("span", { id: "media-bar-status" });
const tracksBox = el("div", { id: "media-bar-tracks" });
tracksBox.hidden = true;
const frames = el("div", { id: "media-bar-frames", class: "media-dock__frames" });
const stopBtn = el("button", { id: "media-bar-stop" });
const pauseBtn = el("button", { id: "media-bar-pause-all" });
const mixerBtn = el("button", { id: "media-bar-mixer" });
const mixerPanel = el("div", { id: "media-bar-mixer-panel" });
const dock = el("div", { id: "media-dock", class: "media-dock" });
dock.appendChild(frames);
bar.appendChild(status);
bar.appendChild(tracksBox);
bar.appendChild(stopBtn);
bar.appendChild(pauseBtn);
bar.appendChild(mixerBtn);
bar.appendChild(mixerPanel);

const body = el("body");
body.dataset = {};
const head = el("head");
const doc = {
  head,
  documentElement: el("html"),
  getElementById(id) {
    const map = {
      "media-bar": bar,
      "media-bar-status": status,
      "media-bar-tracks": tracksBox,
      "media-bar-frames": frames,
      "media-bar-stop": stopBtn,
      "media-bar-pause-all": pauseBtn,
      "media-bar-mixer": mixerBtn,
      "media-bar-mixer-panel": mixerPanel,
      "media-dock": dock
    };
    return map[id] || null;
  },
  createElement(tag) {
    return el(tag);
  },
  querySelector() {
    return null;
  },
  addEventListener() {},
  body
};

sandbox.document = doc;
sandbox.window.document = doc;
sandbox.HTMLIFrameElement = function () {};
sandbox.setInterval = () => 1;
sandbox.clearInterval = () => {};

const players = [];
function MockPlayer(id, opts) {
  this.id = id;
  this.opts = opts;
  this.state = -1;
  this.playCalls = 0;
  this.pauseCalls = 0;
  this.volume = 100;
  this.playVideo = () => {
    this.state = 1;
    this.playCalls += 1;
  };
  this.pauseVideo = () => {
    this.state = 2;
    this.pauseCalls += 1;
  };
  this.stopVideo = () => {
    this.state = 0;
  };
  this.destroy = () => {
    this.state = -2;
  };
  this.getPlayerState = () => this.state;
  this.setVolume = (v) => {
    this.volume = v;
  };
  this.mute = () => {};
  this.unMute = () => {};
  this.setSize = () => {};
  players.push(this);
  Promise.resolve().then(() => {
    this.state = 1;
    opts.events?.onReady?.({ target: this });
  });
}
sandbox.window.YT = {
  Player: MockPlayer,
  PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }
};
sandbox.YT = sandbox.window.YT;

/* Re-init MediaBar against stub document + mock YT */
sandbox.window.MediaBar = null;
vm.runInContext(mediaBar, sandbox);
const MB2 = sandbox.window.MediaBar;
MB2.init();

return Promise.resolve()
  .then(() => {
    MB2.play("aaaaaaaaaaa", "Rain");
    MB2.play("bbbbbbbbbbb", "Drums");
    MB2.play("aaaaaaaaaaa", "Rain again");
    return Promise.resolve();
  })
  .then(() => Promise.resolve())
  .then(() => {
    const playing = MB2.getTracks();
    if (playing.length !== 2) fail(`expected 2 tracks, got ${playing.length}`);
    else pass("play stacks distinct tracks (dedupes same id)");
    if (frames.children.length !== 2) fail(`expected 2 player hosts, got ${frames.children.length}`);
    else pass("side-by-side player hosts in dock");
    if (players.length < 2) fail(`expected YT.Player instances, got ${players.length}`);
    else pass("YT.Player created per track");

    /* Simulate YouTube pausing sibling when another plays */
    players[0].state = 2;
    players[0].playCalls = 0;
    players[1].opts.events.onStateChange({ data: 1, target: players[1] });
    if (players[0].playCalls < 1) fail("resumeAll should re-play paused sibling");
    else pass("IFrame API resumes paused sibling tracks");

    MB2.setTrackVolume(playing[0].key, 40);
    if (players[0].volume !== 40) fail("setTrackVolume should update YT volume");
    else pass("per-track volume via IFrame API");

    MB2.pauseAll();
    const afterPause = MB2.getTracks();
    if (afterPause.some((tr) => tr.wantPlay)) fail("pauseAll should clear wantPlay");
    else pass("pauseAll keeps tracks mounted without wantPlay");
    if (frames.children.length !== 2) fail("pauseAll must not destroy player hosts");
    else pass("pauseAll preserves player dock hosts");

    MB2.stopTrack(playing[0].key);
    if (MB2.getTracks().length !== 1) fail("stopTrack should remove one");
    else pass("stopTrack removes one layer");
    MB2.stop();
    if (MB2.getTracks().length !== 0) fail("stop should clear all");
    else pass("stop clears all tracks");

    /* Layout change must not remount */
    MB2.play("ccccccccccc", "Wind");
    const beforeLayout = MB2.getTracks()[0].key;
    MB2.onLayoutChange();
    if (MB2.getTracks()[0].key !== beforeLayout) fail("onLayoutChange must not remount tracks");
    else pass("onLayoutChange preserves tracks");
    MB2.stop();

    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll maps/media checks passed.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
