/**
 * UVTT / calibrated maps stored on location catalogue entries.
 * Geometry: {DM_DATA_ROOT}/assets/uvtt/location/{id}.json
 * Raster: existing mapImage asset under assets/maps/location/{id}.*
 */
"use strict";

const path = require("path");
const { assertSafeId, assertCatalogueType } = require("./ids");
const { parseUvttText } = require("./uvtt");
const assets = require("./assets");
const {
  dataRoot,
  writeJsonAtomic,
  readJson,
  removeFile,
  ensureDir,
  pathExists
} = require("./atomic-fs");

function uvttDocPath(type, id) {
  return path.join(
    dataRoot(),
    "assets",
    "uvtt",
    assertCatalogueType(type),
    `${assertSafeId(id, "entry id")}.json`
  );
}

function calibrationSummary(normalized, extra = {}) {
  return {
    kind: normalized.kind || "uvtt",
    sourceFormat: normalized.sourceFormat || "uvtt",
    widthPx: normalized.widthPx,
    heightPx: normalized.heightPx,
    grid: normalized.grid,
    scale: normalized.scale,
    display: normalized.display,
    import: {
      ...(normalized.import || {}),
      ...extra
    }
  };
}

async function importUvtt(type, locationId, { text, filename, name } = {}) {
  const catType = assertCatalogueType(type);
  if (catType !== "location") {
    const err = new Error("UVTT import is only supported for location catalogue entries");
    err.status = 400;
    throw err;
  }
  const id = assertSafeId(locationId, "entry id");
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

  const imageResult = await assets.putFieldFromBuffer(
    catType,
    id,
    "mapImage",
    image.buffer,
    image.mime
  );

  const now = new Date().toISOString();
  const full = {
    id,
    catalogueType: catType,
    ...normalized,
    imageUrl: imageResult.url,
    imageMime: image.mime,
    import: {
      ...(normalized.import || {}),
      importedAt: now,
      sourceFilename: filename ? String(filename) : null
    },
    updatedAt: now
  };

  const docPath = uvttDocPath(catType, id);
  await ensureDir(path.dirname(docPath));
  await writeJsonAtomic(docPath, full);

  const mapCalibration = calibrationSummary(normalized, {
    importedAt: now,
    sourceFilename: filename ? String(filename) : null
  });

  const catalogues = require("./catalogues");
  const entry = await catalogues.get(catType, id);
  if (entry) {
    await catalogues.upsert(catType, id, {
      ...entry,
      mapImage: imageResult.url,
      mapCalibration,
      updatedAt: Date.now()
    });
  }

  return {
    mapImage: imageResult.url,
    mapCalibration
  };
}

async function getFullMap(type, id) {
  const catType = assertCatalogueType(type);
  const safeId = assertSafeId(id, "entry id");
  const docPath = uvttDocPath(catType, safeId);
  if (!(await pathExists(docPath))) return null;
  const raw = await readJson(docPath, null);
  if (!raw || typeof raw !== "object") return null;
  if (!raw.imageUrl) {
    const asset = await assets.readAsset("maps", catType, safeId);
    if (asset) raw.imageUrl = assets.publicUrl("maps", catType, safeId);
  }
  return raw;
}

async function deleteUvtt(type, id) {
  const catType = assertCatalogueType(type);
  const safeId = assertSafeId(id, "entry id");
  const docPath = uvttDocPath(catType, safeId);
  if (await pathExists(docPath)) await removeFile(docPath);
  return true;
}

/**
 * Patch display / scale on a location UVTT sidecar and sync mapCalibration on the catalogue entry.
 */
async function patchCalibration(type, locationId, patch = {}) {
  const catType = assertCatalogueType(type);
  if (catType !== "location") {
    const err = new Error("UVTT calibration patch is only supported for location catalogue entries");
    err.status = 400;
    throw err;
  }
  const id = assertSafeId(locationId, "entry id");
  const full = await getFullMap(catType, id);
  if (!full) {
    const err = new Error("No UVTT map for this entry");
    err.status = 404;
    throw err;
  }

  if (patch.display && typeof patch.display === "object") {
    full.display = { ...(full.display || {}), ...patch.display };
  }
  if (patch.scale && typeof patch.scale === "object") {
    full.scale = { ...(full.scale || {}), ...patch.scale };
  }
  full.updatedAt = new Date().toISOString();

  const docPath = uvttDocPath(catType, id);
  await ensureDir(path.dirname(docPath));
  await writeJsonAtomic(docPath, full);

  const mapCalibration = calibrationSummary(full, full.import || {});
  const catalogues = require("./catalogues");
  const entry = await catalogues.get(catType, id);
  if (entry) {
    await catalogues.upsert(catType, id, {
      ...entry,
      mapCalibration,
      updatedAt: Date.now()
    });
  }

  return { map: full, mapCalibration };
}

module.exports = {
  importUvtt,
  getFullMap,
  deleteUvtt,
  patchCalibration,
  calibrationSummary
};
