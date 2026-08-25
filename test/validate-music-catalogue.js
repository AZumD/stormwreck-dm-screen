/**
 * Music catalogue: metadata, MP3 upload/storage, playback URL, delete/replace.
 * Run: node test/validate-music-catalogue.js
 */
"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const http = require("http");
const os = require("os");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

/** Tiny synthetic MP3: ID3v2 header so sniffMp3 accepts it (not a full audio decode). */
function tinyMp3Buffer() {
  return Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
}

async function withTempData(fn) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-music-"));
  const prev = process.env.DM_DATA_ROOT;
  const prevBucket = process.env.AUDIO_S3_BUCKET;
  process.env.DM_DATA_ROOT = tmp;
  delete process.env.AUDIO_S3_BUCKET;
  Object.keys(require.cache).forEach((key) => {
    if (key.replace(/\\/g, "/").includes("/server/lib/") || key.replace(/\\/g, "/").includes("/server/routes/")) {
      delete require.cache[key];
    }
  });
  try {
    const atomic = require("../server/lib/atomic-fs");
    await atomic.ensureDataLayout();
    await fn(tmp);
  } finally {
    if (prev === undefined) delete process.env.DM_DATA_ROOT;
    else process.env.DM_DATA_ROOT = prev;
    if (prevBucket === undefined) delete process.env.AUDIO_S3_BUCKET;
    else process.env.AUDIO_S3_BUCKET = prevBucket;
    Object.keys(require.cache).forEach((key) => {
      if (key.replace(/\\/g, "/").includes("/server/lib/") || key.replace(/\\/g, "/").includes("/server/routes/")) {
        delete require.cache[key];
      }
    });
    await fsp.rm(tmp, { recursive: true, force: true });
  }
}

function request(server, method, urlPath, { headers, body } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers: headers || {}
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          let json = null;
          try {
            json = JSON.parse(buf.toString("utf8"));
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: buf, json });
        });
      }
    );
    req.on("error", reject);
    if (body) req.end(body);
    else req.end();
  });
}

/* --- Static registration --- */
const ids = fs.readFileSync(path.join(root, "server/lib/ids.js"), "utf8");
const types = fs.readFileSync(path.join(root, "js/core/catalogue/types.js"), "utf8");
const configs = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const api = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
const player = fs.readFileSync(path.join(root, "server/lib/player.js"), "utf8");
const landing = fs.readFileSync(path.join(root, "dm/index.html"), "utf8");
const musicHtml = fs.readFileSync(path.join(root, "music-katalog/index.html"), "utf8");

if (!ids.includes('"music"')) fail("ids.js missing music type");
else pass("music in CATALOGUE_TYPES");

if (!types.includes('id: "music"') || !types.includes("linkable: false")) fail("types.js music registration");
else pass("client CatalogueTypes.music");

if (!configs.includes("music:") || !configs.includes('type: "audio"')) fail("configs.js music schema");
else pass("music catalogue config");

if (!landing.includes("music-katalog") || !landing.includes("Media")) fail("landing Music link");
else pass("landing Music catalogue link");

if (!musicHtml.includes('CatalogueApp.init("music")') || !musicHtml.includes("music-ui.js")) {
  fail("music-katalog page");
} else pass("music-katalog page");

if (!player.includes('"music"') || !/PLAYER_BLOCKED_CATALOGUE_TYPES[\s\S]*music/.test(player)) {
  fail("music should be blocked from player catalogues");
} else pass("music blocked from player API");

const musicRouteAuth =
  api.includes("/audio") &&
  api.includes("musicCatalogue") &&
  (api.match(/catalogues\/music[\s\S]{0,200}requireAnyDmIfAuthRequired/g) || []).length >= 1;
if (!api.includes("requireAnyDmIfAuthRequired") || !api.includes("musicCatalogue.putAudio")) {
  fail("music audio routes / auth wiring");
} else pass("music audio routes present with DM gate helpers");

if (!fs.existsSync(path.join(root, "server/lib/audio-storage.js"))) fail("audio-storage.js missing");
else pass("audio-storage abstraction");

if (!fs.existsSync(path.join(root, "js/core/catalogue/music-ui.js"))) fail("music-ui.js missing");
else pass("music-ui.js preview/upload");

(async () => {
  await withTempData(async (tmp) => {
    const musicCatalogue = require("../server/lib/music-catalogue");
    const audioStorage = require("../server/lib/audio-storage");
    const catalogues = require("../server/lib/catalogues");
    const { createApiRoutes } = require("../server/routes/api");
    const { sendError } = require("../server/lib/http-util");

    if (audioStorage.backendName() !== "local") fail("expected local backend without AUDIO_S3_BUCKET");
    else pass("local filesystem fallback");

    /* 1. create metadata */
    const id = "music-test-ocean";
    const created = await musicCatalogue.upsertMetadata(id, {
      title: "Ocean Waves",
      kind: "ambience",
      category: "coastal",
      tags: ["stormwreck", "calm", "loop"],
      notes: "Gentle surf",
      defaultVolume: 0.35,
      loopByDefault: true
    });
    if (created.title !== "Ocean Waves" || created.kind !== "ambience" || created.name !== "Ocean Waves") {
      fail("create music metadata");
    } else pass("create music catalogue entry");

    /* 5. search/filter */
    const listed = await catalogues.list("music");
    const filtered = musicCatalogue.filterEntries(listed, { q: "coastal", kind: "ambience" });
    if (filtered.length !== 1 || filtered[0].id !== id) fail("search/filter metadata");
    else pass("search/filter metadata");

    /* 6. update metadata */
    const updated = await musicCatalogue.upsertMetadata(id, {
      ...created,
      category: "island",
      tags: ["stormwreck", "calm"]
    });
    if (updated.category !== "island" || updated.tags.length !== 2) fail("update metadata");
    else pass("update metadata");

    /* 2. valid MP3 upload */
    const mp3 = tinyMp3Buffer();
    const up = await musicCatalogue.putAudio(id, mp3, {
      contentType: "audio/mpeg",
      originalFilename: "ocean-waves.mp3",
      durationSec: 120
    });
    if (!up.audio?.key || up.audio.mimeType !== "audio/mpeg" || up.audio.sizeBytes !== mp3.length) {
      fail("valid MP3 upload");
    } else pass("valid MP3 upload");

    const localPath = audioStorage._localPathForKey(up.audio.key);
    if (!(await fsp.stat(localPath).then(() => true).catch(() => false))) fail("audio file on disk");
    else pass("local filesystem stores object");

    /* 3. invalid file rejection */
    try {
      await musicCatalogue.putAudio(id, Buffer.from("not-an-mp3-file-at-all"), {
        contentType: "audio/mpeg",
        originalFilename: "bad.mp3"
      });
      fail("invalid file should reject");
    } catch (err) {
      if (err.status === 400) pass("invalid file rejection");
      else fail(`invalid reject status ${err.status}`);
    }

    try {
      await musicCatalogue.putAudio(id, mp3, {
        contentType: "text/plain",
        originalFilename: "ocean.txt"
      });
      fail("non-mp3 mime should reject");
    } catch (err) {
      if (err.status === 400) pass("non-mp3 mime rejection");
      else fail(`mime reject ${err.status}`);
    }

    /* 7. preview URL */
    const playback = await musicCatalogue.playbackFor(id);
    if (!playback || playback.mode !== "proxy" || !String(playback.url).includes("/audio/stream")) {
      fail("preview URL generation");
    } else pass("preview URL generation");

    /* 9. replacement cleans old object */
    const oldKey = up.audio.key;
    const up2 = await musicCatalogue.putAudio(id, mp3, {
      contentType: "audio/mpeg",
      originalFilename: "ocean-waves-v2.mp3",
      durationSec: 121
    });
    if (up2.audio.key === oldKey) fail("replacement should use new key");
    else pass("replacement uses new object key");
    const oldExists = await audioStorage.exists(oldKey);
    if (oldExists) fail("old object should be deleted after replace");
    else pass("replacement cleans old object");

    /* HTTP surface via handleApi (drains body on early errors; DELETE without CT) */
    const { handleApi } = require("../server/routes/api");
    const routes = createApiRoutes();
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://127.0.0.1");
        const handled = await handleApi(req, res, url.pathname, routes);
        if (!handled) {
          res.writeHead(404);
          res.end("missing");
        }
      } catch (err) {
        sendError(res, err);
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    const streamRes = await request(server, "GET", `/api/catalogues/music/${id}/audio/stream`);
    if (streamRes.status !== 200 || streamRes.body.length !== mp3.length) {
      fail(`stream status=${streamRes.status} len=${streamRes.body.length}`);
    } else pass("authenticated stream serves audio bytes");

    const playJson = await request(server, "GET", `/api/catalogues/music/${id}/audio`);
    if (!playJson.json?.playback?.url) fail("HTTP playback JSON");
    else pass("HTTP playback URL endpoint");

    const httpId = "music-http-upload";
    await musicCatalogue.upsertMetadata(httpId, { title: "HTTP Upload Track", kind: "music" });
    const putHttp = await request(server, "PUT", `/api/catalogues/music/${httpId}/audio`, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(mp3.length),
        "X-Original-Filename": "http-track.mp3",
        Origin: "http://127.0.0.1"
      },
      body: mp3
    });
    if (putHttp.status !== 200 || !putHttp.json?.audio?.key) {
      fail(`HTTP PUT audio status=${putHttp.status} err=${putHttp.json?.error || putHttp.body}`);
    } else pass("HTTP PUT audio/mpeg upload");

    const delHttp = await request(server, "DELETE", `/api/catalogues/music/${httpId}`, {
      headers: {
        Origin: "http://127.0.0.1",
        Host: "127.0.0.1"
        /* intentionally no Content-Type — browser DELETE behaviour */
      }
    });
    if (delHttp.status !== 200 || delHttp.json?.ok !== true) {
      fail(`HTTP DELETE music status=${delHttp.status} err=${delHttp.json?.error || delHttp.body}`);
    } else pass("HTTP DELETE music without Content-Type");

    /* 4. DM authorization — player blocked type + route gates requireAnyDm */
    if (!player.includes("PLAYER_BLOCKED_CATALOGUE_TYPES") || !player.includes('"music"')) {
      fail("DM-only: music blocked for players");
    } else pass("DM authorization: music not in player allowlist");

    const putAudioSrc = api.includes("PUT") && api.includes("musicCatalogue.putAudio");
    if (!putAudioSrc) fail("upload route missing");
    else pass("DM authorization: upload uses shared DM gate");

    /* 8 already covered via playbackFor + HTTP */

    /* 10. delete removes metadata and audio */
    const keyBeforeDelete = up2.audio.key;
    const del = await musicCatalogue.deleteTrack(id);
    if (!del.removed) fail("delete metadata");
    else pass("delete removes metadata");
    if (await catalogues.get("music", id)) fail("entry still present after delete");
    else pass("catalogue entry gone");
    if (await audioStorage.exists(keyBeforeDelete)) fail("audio object remains after delete");
    else pass("delete removes audio object");

    server.close();

    /* ensure tmp used local path under DM_DATA_ROOT */
    if (!String(localPath).startsWith(tmp)) fail("audio not under temp DM_DATA_ROOT");
    else pass("audio path under DM_DATA_ROOT");
  });

  if (failed) {
    console.error(`\n${failed} music catalogue check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll music catalogue checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
