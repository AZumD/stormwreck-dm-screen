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

  const dataUrl = `data:${image.mime};base64,${image.buffer.toString("base64")}`;
  const imageResult = await assets.putFieldFromDataUrl(catType, id, "mapImage", dataUrl);

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

  return {
    mapImage: imageResult.url,
    mapCalibration: calibrationSummary(normalized, {
      importedAt: now,
      sourceFilename: filename ? String(filename) : null
    })
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

module.exports = {
  importUvtt,
  getFullMap,
  deleteUvtt,
  calibrationSummary
};
