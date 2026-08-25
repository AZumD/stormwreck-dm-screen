/**
 * Binary asset storage under data/assets/{portraits|maps}/{type}/{id}.{ext}
 */
"use strict";

const path = require("path");
const fsp = require("fs/promises");
const {
  assertAssetKind,
  assertCatalogueType,
  assertSafeId,
  assertAssetField
} = require("./ids");
const {
  dataRoot,
  writeBinaryAtomic,
  removeFile,
  pathExists,
  ensureDir,
  listJsonFiles
} = require("./atomic-fs");

const EXT_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg"
};

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};

function fieldToKind(field) {
  const f = assertAssetField(field);
  return f === "mapImage" ? "maps" : "portraits";
}

function assetDir(kind, type) {
  return path.join(dataRoot(), "assets", assertAssetKind(kind), assertCatalogueType(type));
}

function publicUrl(kind, type, id) {
  return `/api/assets/${assertAssetKind(kind)}/${assertCatalogueType(type)}/${assertSafeId(id, "entry id")}`;
}

async function findExistingFile(kind, type, id) {
  const dir = assetDir(kind, type);
  const safeId = assertSafeId(id, "entry id");
  try {
    const names = await fsp.readdir(dir);
    const hit = names.find((n) => n.startsWith(`${safeId}.`) && !n.includes(".tmp"));
    return hit ? path.join(dir, hit) : null;
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    throw err;
  }
}

function parseDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!m) {
    const err = new Error("Expected data URL");
    err.status = 400;
    throw err;
  }
  const mime = (m[1] || "application/octet-stream").trim().toLowerCase();
  const isBase64 = !!m[2];
  const data = m[3] || "";
  const buffer = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
  if (!buffer.length) {
    const err = new Error("Empty image");
    err.status = 400;
    throw err;
  }
  return { mime, buffer };
}

async function putFromBuffer(kind, type, id, buffer, mime) {
  const safeMime = String(mime || "application/octet-stream").toLowerCase();
  const ext = EXT_BY_MIME[safeMime] || "bin";
  const dir = assetDir(kind, type);
  await ensureDir(dir);
  const existing = await findExistingFile(kind, type, id);
  if (existing) await removeFile(existing);
  const filePath = path.join(dir, `${assertSafeId(id, "entry id")}.${ext}`);
  await writeBinaryAtomic(filePath, buffer);
  return {
    url: publicUrl(kind, type, id),
    mime: safeMime,
    bytes: buffer.length,
    path: filePath
  };
}

async function putFromDataUrl(kind, type, id, dataUrl) {
  const { mime, buffer } = parseDataUrl(dataUrl);
  return putFromBuffer(kind, type, id, buffer, mime);
}

async function putFieldFromDataUrl(type, id, field, dataUrl) {
  return putFromDataUrl(fieldToKind(field), type, id, dataUrl);
}

async function putFieldFromBuffer(type, id, field, buffer, mime) {
  return putFromBuffer(fieldToKind(field), type, id, buffer, mime);
}

async function readAsset(kind, type, id) {
  const filePath = await findExistingFile(kind, type, id);
  if (!filePath) return null;
  const buffer = await fsp.readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  return { buffer, mime, filePath };
}

async function deleteAsset(kind, type, id) {
  const filePath = await findExistingFile(kind, type, id);
  if (!filePath) return false;
  return removeFile(filePath);
}

async function deleteField(type, id, field) {
  return deleteAsset(fieldToKind(field), type, id);
}

function isAssetUrl(value) {
  return typeof value === "string" && value.startsWith("/api/assets/");
}

module.exports = {
  fieldToKind,
  publicUrl,
  putFromDataUrl,
  putFromBuffer,
  putFieldFromDataUrl,
  putFieldFromBuffer,
  readAsset,
  deleteAsset,
  deleteField,
  findExistingFile,
  isAssetUrl,
  parseDataUrl
};
