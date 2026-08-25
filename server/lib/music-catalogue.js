/**
 * Music catalogue audio helpers — validate MP3 uploads, wire metadata ↔ storage.
 */
"use strict";

const crypto = require("crypto");
const catalogues = require("./catalogues");
const audioStorage = require("./audio-storage");
const { assertSafeId } = require("./ids");

const MUSIC_TYPE = "music";
const ALLOWED_KINDS = new Set(["ambience", "creature", "music"]);
const ALLOWED_MIME = new Set(["audio/mpeg", "audio/mp3", "audio/mpeg3"]);
const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
const EXT_BY_MIME = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mpeg3": "mp3"
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeKind(kind) {
  const k = String(kind || "ambience").trim().toLowerCase();
  return ALLOWED_KINDS.has(k) ? k : "ambience";
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 40);
}

function clampVolume(v, fallback = 0.7) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function sniffMp3(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  /* ID3v2 */
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  /* MPEG frame sync 0xFFEx */
  for (let i = 0; i < Math.min(buffer.length - 1, 8192); i += 1) {
    if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) return true;
  }
  return false;
}

function resolveMime(contentType, originalFilename) {
  const raw = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (ALLOWED_MIME.has(raw)) return "audio/mpeg";
  const name = String(originalFilename || "").toLowerCase();
  if (name.endsWith(".mp3")) return "audio/mpeg";
  return null;
}

function normalizeMusicEntry(entry, id) {
  const now = Date.now();
  const title = String(entry?.title || entry?.name || "Untitled track").trim() || "Untitled track";
  const out = {
    ...(entry && typeof entry === "object" ? entry : {}),
    id,
    title,
    name: title /* catalogue list/search compatibility */,
    kind: normalizeKind(entry?.kind),
    category: String(entry?.category || "").trim(),
    tags: normalizeTags(entry?.tags),
    notes: String(entry?.notes || entry?.description || "").trim(),
    defaultVolume: clampVolume(entry?.defaultVolume, 0.7),
    loopByDefault: entry?.loopByDefault !== false && entry?.loopByDefault !== 0 && entry?.loopByDefault !== "0",
    updatedAt: now
  };
  if (!out.createdAt) out.createdAt = now;
  if (entry?.audio && typeof entry.audio === "object") {
    out.audio = { ...entry.audio };
  } else if (!out.audio) {
    out.audio = null;
  }
  return out;
}

async function upsertMetadata(id, body) {
  const safeId = assertSafeId(id, "entry id");
  const existing = (await catalogues.get(MUSIC_TYPE, safeId)) || {};
  const merged = normalizeMusicEntry(
    {
      ...existing,
      ...(body || {}),
      audio: body?.audio !== undefined ? body.audio : existing.audio
    },
    safeId
  );
  if (existing.createdAt) merged.createdAt = existing.createdAt;
  return catalogues.upsert(MUSIC_TYPE, safeId, merged);
}

async function putAudio(id, buffer, { contentType, originalFilename, durationSec } = {}) {
  const safeId = assertSafeId(id, "entry id");
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw httpError(400, "Empty audio body");
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw httpError(413, `Audio too large (max ${Math.floor(MAX_AUDIO_BYTES / (1024 * 1024))}MB)`);
  }
  const mime = resolveMime(contentType, originalFilename);
  if (!mime) throw httpError(400, "Only MP3 uploads are supported in this version");
  if (!sniffMp3(buffer)) throw httpError(400, "File does not look like a valid MP3");

  let entry = await catalogues.get(MUSIC_TYPE, safeId);
  if (!entry) {
    entry = await upsertMetadata(safeId, {
      title: String(originalFilename || "Untitled track").replace(/\.[^.]+$/, "") || "Untitled track"
    });
  }

  const ext = EXT_BY_MIME[mime] || "mp3";
  const newKey = audioStorage.generateObjectKey(safeId, ext);
  const oldKey = entry.audio?.key ? String(entry.audio.key) : null;

  let putResult;
  try {
    putResult = await audioStorage.put({ key: newKey, buffer, contentType: mime });
  } catch (err) {
    throw err;
  }

  const audioMeta = {
    key: putResult.key,
    originalFilename: String(originalFilename || "").slice(0, 255) || `${safeId}.mp3`,
    mimeType: mime,
    sizeBytes: buffer.length,
    durationSec:
      durationSec != null && Number.isFinite(Number(durationSec)) ? Math.max(0, Number(durationSec)) : entry.audio?.durationSec ?? null,
    storageBackend: putResult.backend,
    objectId: crypto.randomBytes(6).toString("hex")
  };

  let saved;
  try {
    saved = await upsertMetadata(safeId, { ...entry, audio: audioMeta });
  } catch (err) {
    await audioStorage.delete(newKey).catch(() => false);
    throw err;
  }

  if (oldKey && oldKey !== newKey) {
    await audioStorage.delete(oldKey).catch((delErr) => {
      console.warn("[music] orphan cleanup failed for", oldKey, delErr.message || delErr);
    });
  }

  return { entry: saved, audio: audioMeta };
}

async function deleteTrack(id) {
  const safeId = assertSafeId(id, "entry id");
  const entry = await catalogues.get(MUSIC_TYPE, safeId);
  const key = entry?.audio?.key ? String(entry.audio.key) : null;

  const removed = await catalogues.remove(MUSIC_TYPE, safeId);
  if (key) {
    try {
      await audioStorage.delete(key);
    } catch (err) {
      console.warn("[music] audio object delete failed after metadata remove", key, err.message || err);
      const wrap = httpError(500, `Track metadata removed but audio delete failed: ${err.message || err}`);
      wrap.partial = true;
      wrap.removed = removed;
      throw wrap;
    }
  }
  return { removed: !!removed, audioDeleted: !!key };
}

async function playbackFor(id, { ttlSec } = {}) {
  const safeId = assertSafeId(id, "entry id");
  const entry = await catalogues.get(MUSIC_TYPE, safeId);
  if (!entry?.audio?.key) return null;
  const hint = audioStorage.getPlaybackUrl(entry.audio.key, { ttlSec });
  if (hint.mode === "signed") {
    return {
      mode: "signed",
      url: hint.url,
      expiresIn: hint.expiresIn,
      mimeType: entry.audio.mimeType || "audio/mpeg",
      entryId: safeId
    };
  }
  return {
    mode: "proxy",
    url: `/api/catalogues/music/${encodeURIComponent(safeId)}/audio/stream`,
    mimeType: entry.audio.mimeType || "audio/mpeg",
    entryId: safeId
  };
}

async function streamAudio(id) {
  const safeId = assertSafeId(id, "entry id");
  const entry = await catalogues.get(MUSIC_TYPE, safeId);
  if (!entry?.audio?.key) return null;
  const stream = await audioStorage.getStream(entry.audio.key);
  if (!stream) return null;
  return {
    ...stream,
    mimeType: entry.audio.mimeType || stream.contentType || "audio/mpeg",
    sizeBytes: entry.audio.sizeBytes || stream.size
  };
}

function matchesSearch(entry, q) {
  if (!q) return true;
  const hay = [entry.title, entry.name, entry.kind, entry.category, entry.notes, ...(entry.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(String(q).toLowerCase());
}

function filterEntries(entries, { q, kind } = {}) {
  return (entries || []).filter((e) => {
    if (kind && normalizeKind(kind) !== normalizeKind(e.kind)) return false;
    return matchesSearch(e, q);
  });
}

module.exports = {
  MUSIC_TYPE,
  ALLOWED_KINDS,
  MAX_AUDIO_BYTES,
  normalizeMusicEntry,
  normalizeKind,
  upsertMetadata,
  putAudio,
  deleteTrack,
  playbackFor,
  streamAudio,
  filterEntries,
  sniffMp3,
  resolveMime
};
