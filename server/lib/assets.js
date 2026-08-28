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
  if (f === "mapImage") return "maps";
  if (f === "tokenImage") return "tokens";
  return "portraits";
}

function assetDir(kind, type) {
  return path.join(dataRoot(), "assets", assertAssetKind(kind), assertCatalogueType(type));
}

/**
 * Public URL for an uploaded asset. Pass `version` (mtime ms) for CDN cache-busting.
 * Legacy callers omit version — unversioned URLs remain valid.
 */
function publicUrl(kind, type, id, version) {
  const base = `/api/assets/${assertAssetKind(kind)}/${assertCatalogueType(type)}/${assertSafeId(id, "entry id")}`;
  if (version == null || version === "") return base;
  const v = encodeURIComponent(String(version));
  return `${base}?v=${v}`;
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
  const stat = await fsp.stat(filePath);
  const version = Math.floor(Number(stat.mtimeMs) || Date.now());
  return {
    url: publicUrl(kind, type, id, version),
    mime: safeMime,
    bytes: buffer.length,
    path: filePath,
    version
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

/**
 * Resolve asset metadata for streaming (no full-file read).
 */
async function resolveAsset(kind, type, id) {
  const filePath = await findExistingFile(kind, type, id);
  if (!filePath) return null;
  const stat = await fsp.stat(filePath);
  if (!stat.isFile()) return null;
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  return {
    filePath,
    mime,
    size: stat.size,
    mtime: stat.mtime,
    mtimeMs: stat.mtimeMs,
    version: Math.floor(Number(stat.mtimeMs) || 0)
  };
}

/** Full buffer read — prefer resolveAsset + stream for HTTP responses. */
async function readAsset(kind, type, id) {
  const meta = await resolveAsset(kind, type, id);
  if (!meta) return null;
  const buffer = await fsp.readFile(meta.filePath);
  return { buffer, mime: meta.mime, filePath: meta.filePath, size: meta.size, mtime: meta.mtime };
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
  resolveAsset,
  readAsset,
  deleteAsset,
  deleteField,
  findExistingFile,
  isAssetUrl,
  parseDataUrl
};
