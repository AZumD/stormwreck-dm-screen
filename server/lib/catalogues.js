/**
 * Catalogue entries — one JSON file per entity under data/catalogues/<type>/.
 */
"use strict";

const path = require("path");
const { assertCatalogueType, assertSafeId } = require("./ids");
const {
  dataRoot,
  writeJsonAtomic,
  readJson,
  removeFile,
  listJsonFiles,
  pathExists,
  ensureDir
} = require("./atomic-fs");

function typeDir(type) {
  return path.join(dataRoot(), "catalogues", assertCatalogueType(type));
}

function entryPath(type, id) {
  const safeType = assertCatalogueType(type);
  const safeId = assertSafeId(id, "entry id");
  return path.join(dataRoot(), "catalogues", safeType, `${safeId}.json`);
}

function normalizeEntry(entry, id) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    const err = new Error("Entry must be a JSON object");
    err.status = 400;
    throw err;
  }
  const out = { ...entry, id };
  if (!out.updatedAt) out.updatedAt = Date.now();
  return out;
}

async function list(type) {
  const dir = typeDir(type);
  await ensureDir(dir);
  const files = await listJsonFiles(dir);
  const entries = [];
  for (const file of files) {
    const id = file.replace(/\.json$/i, "");
    try {
      assertSafeId(id, "entry id");
    } catch {
      continue;
    }
    const data = await readJson(path.join(dir, file), null);
    if (!data || typeof data !== "object") continue;
    const entry = { ...data, id: data.id || id };
    entries.push(entry);
  }
  entries.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" })
  );
  return entries;
}

async function get(type, id) {
  const file = entryPath(type, id);
  const data = await readJson(file, null);
  if (!data) return null;
  return { ...data, id: data.id || id };
}

async function upsert(type, id, entry) {
  const safeId = assertSafeId(id, "entry id");
  if (entry && entry.id && String(entry.id) !== safeId) {
    const err = new Error("Body id must match URL id");
    err.status = 400;
    throw err;
  }
  const saved = normalizeEntry(entry || {}, safeId);
  await writeJsonAtomic(entryPath(type, safeId), saved);
  return saved;
}

async function remove(type, id) {
  return removeFile(entryPath(type, id));
}

async function exists(type, id) {
  return pathExists(entryPath(type, id));
}

module.exports = {
  list,
  get,
  upsert,
  remove,
  exists,
  entryPath,
  typeDir
};
