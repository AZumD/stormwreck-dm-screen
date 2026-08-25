/**
 * Campaign-scoped calibrated / UVTT maps.
 * Images: {DM_DATA_ROOT}/assets/maps/campaign-map/{campaignId}/{mapId}.{ext}
 * Metadata: campaigns/{id}/maps.json
 */
"use strict";

const path = require("path");
const fsp = require("fs/promises");
const { assertSafeId } = require("./ids");
const {
  dataRoot,
  writeJsonAtomic,
  readJson,
  writeBinaryAtomic,
  removeFile,
  ensureDir,
  pathExists,
  assertInsideData
} = require("./atomic-fs");
const { parseUvttText } = require("./uvtt");

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

function mapsDocPath(campaignId) {
  return path.join(dataRoot(), "campaigns", assertSafeId(campaignId, "campaign id"), "maps.json");
}

function imageDir(campaignId) {
  return path.join(
    dataRoot(),
    "assets",
    "maps",
    "campaign-map",
    assertSafeId(campaignId, "campaign id")
  );
}

function emptyDoc() {
  return { version: 1, maps: {} };
}

async function loadDoc(campaignId) {
  const raw = await readJson(mapsDocPath(campaignId), emptyDoc());
  if (!raw || typeof raw !== "object") return emptyDoc();
  return {
    version: 1,
    maps: raw.maps && typeof raw.maps === "object" && !Array.isArray(raw.maps) ? raw.maps : {}
  };
}

async function saveDoc(campaignId, doc) {
  await writeJsonAtomic(mapsDocPath(campaignId), {
    version: 1,
    maps: doc.maps || {}
  });
}

function publicImageUrl(campaignId, mapId) {
  return `/api/campaigns/${assertSafeId(campaignId, "campaign id")}/maps/${assertSafeId(mapId, "map id")}/image`;
}

function newMapId() {
  return `map-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function findImageFile(campaignId, mapId) {
  const dir = imageDir(campaignId);
  const safeId = assertSafeId(mapId, "map id");
  try {
    const names = await fsp.readdir(dir);
    const hit = names.find((n) => n.startsWith(`${safeId}.`) && !n.includes(".tmp"));
    return hit ? path.join(dir, hit) : null;
  } catch (e) {
    if (e && e.code === "ENOENT") return null;
    throw e;
  }
}

async function writeMapImage(campaignId, mapId, buffer, ext) {
  const dir = imageDir(campaignId);
  await ensureDir(dir);
  const safeId = assertSafeId(mapId, "map id");
  const existing = await findImageFile(campaignId, mapId);
  if (existing) await removeFile(existing);
  const filePath = path.join(dir, `${safeId}.${ext}`);
  await writeBinaryAtomic(filePath, buffer);
  return filePath;
}

function toSummary(map) {
  if (!map) return null;
  return {
    id: map.id,
    name: map.name,
    kind: map.kind,
    sourceFormat: map.sourceFormat || null,
    imageUrl: map.imageUrl,
    widthPx: map.widthPx,
    heightPx: map.heightPx,
    grid: map.grid,
    scale: map.scale,
    display: map.display,
    import: map.import
      ? {
          formatVersion: map.import.formatVersion,
          stats: map.import.stats,
          importedAt: map.import.importedAt
        }
      : null,
    createdAt: map.createdAt,
    updatedAt: map.updatedAt
  };
}

async function listMaps(campaignId) {
  const doc = await loadDoc(campaignId);
  return Object.values(doc.maps)
    .map(toSummary)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function getMap(campaignId, mapId) {
  const doc = await loadDoc(campaignId);
  const map = doc.maps[assertSafeId(mapId, "map id")];
  return map || null;
}

async function importUvtt(campaignId, { text, filename, name } = {}) {
  const sourceFormat = String(filename || "")
    .toLowerCase()
    .endsWith(".dd2vtt")
    ? "dd2vtt"
    : String(filename || "")
          .toLowerCase()
          .endsWith(".uvtt")
      ? "uvtt"
      : "uvtt";

  const { map: normalized, image } = parseUvttText(text, {
    sourceFormat,
    name: name || (filename ? String(filename).replace(/\.(dd2vtt|uvtt)$/i, "") : null)
  });

  const mapId = newMapId();
  const now = new Date().toISOString();
  await writeMapImage(campaignId, mapId, image.buffer, image.ext);

  const entry = {
    id: mapId,
    campaignId: assertSafeId(campaignId, "campaign id"),
    ...normalized,
    imageUrl: publicImageUrl(campaignId, mapId),
    imageMime: image.mime,
    import: {
      ...normalized.import,
      importedAt: now,
      sourceFilename: filename ? String(filename) : null
    },
    createdAt: now,
    updatedAt: now
  };

  const doc = await loadDoc(campaignId);
  doc.maps[mapId] = entry;
  await saveDoc(campaignId, doc);
  return entry;
}

async function patchMap(campaignId, mapId, patch) {
  const doc = await loadDoc(campaignId);
  const id = assertSafeId(mapId, "map id");
  const existing = doc.maps[id];
  if (!existing) {
    const err = new Error("Map not found");
    err.status = 404;
    throw err;
  }

  const next = { ...existing };
  if (patch.name != null) next.name = String(patch.name).trim() || next.name;
  if (patch.scale && typeof patch.scale === "object") {
    const dpg = Number(patch.scale.distancePerGrid);
    next.scale = {
      distancePerGrid:
        Number.isFinite(dpg) && dpg > 0 ? dpg : existing.scale?.distancePerGrid || 5,
      unit: patch.scale.unit != null ? String(patch.scale.unit) : existing.scale?.unit || "ft"
    };
  }
  if (patch.display && typeof patch.display === "object") {
    next.display = {
      showGrid:
        patch.display.showGrid != null
          ? Boolean(patch.display.showGrid)
          : Boolean(existing.display?.showGrid),
      snapToGrid:
        patch.display.snapToGrid != null
          ? Boolean(patch.display.snapToGrid)
          : Boolean(existing.display?.snapToGrid)
    };
  }
  /* Manual calibration for image maps */
  if (patch.grid && typeof patch.grid === "object" && existing.kind !== "uvtt") {
    const ppg = Number(patch.grid.pixelsPerGrid);
    const sx = Number(patch.grid.sizeX);
    const sy = Number(patch.grid.sizeY);
    if (Number.isFinite(ppg) && ppg > 0) {
      next.grid = {
        type: "square",
        sizeX: Number.isFinite(sx) && sx > 0 ? sx : existing.grid?.sizeX || 1,
        sizeY: Number.isFinite(sy) && sy > 0 ? sy : existing.grid?.sizeY || 1,
        pixelsPerGrid: ppg,
        origin: asOrigin(patch.grid.origin) || existing.grid?.origin || { x: 0, y: 0 }
      };
      next.kind = "calibrated";
      if (next.widthPx && next.grid.pixelsPerGrid) {
        next.grid.sizeX = next.widthPx / next.grid.pixelsPerGrid;
        next.grid.sizeY = (next.heightPx || next.widthPx) / next.grid.pixelsPerGrid;
      }
    }
  }

  next.updatedAt = new Date().toISOString();
  doc.maps[id] = next;
  await saveDoc(campaignId, doc);
  return next;
}

function asOrigin(o) {
  if (!o || typeof o !== "object") return null;
  const x = Number(o.x);
  const y = Number(o.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

async function deleteMap(campaignId, mapId) {
  const doc = await loadDoc(campaignId);
  const id = assertSafeId(mapId, "map id");
  if (!doc.maps[id]) {
    const err = new Error("Map not found");
    err.status = 404;
    throw err;
  }
  delete doc.maps[id];
  await saveDoc(campaignId, doc);
  const img = await findImageFile(campaignId, id);
  if (img) await removeFile(img);
  return true;
}

async function resolveMapImage(campaignId, mapId) {
  const map = await getMap(campaignId, mapId);
  if (!map) {
    const err = new Error("Map not found");
    err.status = 404;
    throw err;
  }
  const filePath = await findImageFile(campaignId, mapId);
  if (!filePath) {
    const err = new Error("Map image not found");
    err.status = 404;
    throw err;
  }
  assertInsideData(filePath);
  const stat = await fsp.stat(filePath);
  if (!stat.isFile()) {
    const err = new Error("Map image not found");
    err.status = 404;
    throw err;
  }
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return {
    filePath,
    mime: MIME_BY_EXT[ext] || map.imageMime || "application/octet-stream",
    size: stat.size,
    mtime: stat.mtime,
    mtimeMs: stat.mtimeMs
  };
}

/** Prefer resolveMapImage + sendFileStream for HTTP. Buffer read kept for tests/tools. */
async function readMapImage(campaignId, mapId) {
  const meta = await resolveMapImage(campaignId, mapId);
  const buffer = await fsp.readFile(meta.filePath);
  return {
    buffer,
    mime: meta.mime,
    filePath: meta.filePath,
    size: meta.size,
    mtime: meta.mtime
  };
}

module.exports = {
  listMaps,
  getMap,
  importUvtt,
  patchMap,
  deleteMap,
  resolveMapImage,
  readMapImage,
  toSummary,
  publicImageUrl,
  loadDoc,
  emptyDoc,
  findImageFile,
  newMapId
};
