/**
 * Atomic JSON / binary writes under /data with optional .bak.
 */
"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

function projectRoot() {
  return path.resolve(__dirname, "..", "..");
}

function dataRoot() {
  if (process.env.DM_DATA_ROOT) {
    return path.resolve(process.env.DM_DATA_ROOT);
  }
  return path.join(projectRoot(), "data");
}

function backupRoot() {
  return path.join(dataRoot(), ".backup");
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function assertInsideData(absPath) {
  const root = path.resolve(dataRoot());
  const resolved = path.resolve(absPath);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    const err = new Error("Path escapes /data");
    err.status = 400;
    throw err;
  }
  return resolved;
}

async function backupExisting(absPath) {
  try {
    await fsp.access(absPath);
  } catch {
    return false;
  }
  const root = dataRoot();
  const rel = path.relative(root, absPath);
  const bakPath = path.join(backupRoot(), `${rel}.bak`);
  await ensureDir(path.dirname(bakPath));
  await fsp.copyFile(absPath, bakPath);
  return true;
}

/**
 * Write JSON with pretty print, trailing newline, temp+rename.
 * @param {string} absPath
 * @param {unknown} value
 * @param {{ backup?: boolean }} [opts]
 */
async function writeJsonAtomic(absPath, value, opts = {}) {
  const target = assertInsideData(absPath);
  await ensureDir(path.dirname(target));
  if (opts.backup !== false) {
    await backupExisting(target);
  }
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await fsp.writeFile(tmp, body, "utf8");
  const fh = await fsp.open(tmp, "r+");
  try {
    await fh.sync();
  } finally {
    await fh.close();
  }
  await fsp.rename(tmp, target);
  return target;
}

async function readJson(absPath, fallback = null) {
  const target = assertInsideData(absPath);
  try {
    const raw = await fsp.readFile(target, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === "ENOENT") return fallback;
    if (err instanceof SyntaxError) {
      const e = new Error(`Corrupted JSON: ${path.basename(target)}`);
      e.status = 500;
      e.cause = err;
      throw e;
    }
    throw err;
  }
}

async function writeBinaryAtomic(absPath, buffer, opts = {}) {
  const target = assertInsideData(absPath);
  await ensureDir(path.dirname(target));
  if (opts.backup !== false) {
    await backupExisting(target);
  }
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, buffer);
  const fh = await fsp.open(tmp, "r+");
  try {
    await fh.sync();
  } finally {
    await fh.close();
  }
  await fsp.rename(tmp, target);
  return target;
}

async function removeFile(absPath) {
  const target = assertInsideData(absPath);
  try {
    await fsp.unlink(target);
    return true;
  } catch (err) {
    if (err && err.code === "ENOENT") return false;
    throw err;
  }
}

async function pathExists(absPath) {
  try {
    await fsp.access(assertInsideData(absPath));
    return true;
  } catch {
    return false;
  }
}

async function listJsonFiles(dir) {
  const target = assertInsideData(dir);
  try {
    const names = await fsp.readdir(target);
    return names.filter((n) => n.endsWith(".json") && !n.endsWith(".tmp"));
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    throw err;
  }
}

async function ensureDataLayout() {
  const root = dataRoot();
  await ensureDir(path.join(root, "catalogues"));
  await ensureDir(path.join(root, "campaigns"));
  await ensureDir(path.join(root, "assets", "portraits"));
  await ensureDir(path.join(root, "assets", "maps"));
  await ensureDir(path.join(root, "assets", "audio"));
  await ensureDir(path.join(root, "catalogues", "music"));
  await ensureDir(backupRoot());
  const indexPath = path.join(root, "campaigns", "index.json");
  if (!(await pathExists(indexPath))) {
    await writeJsonAtomic(indexPath, { version: 1, campaigns: [] }, { backup: false });
  }
  const readme = path.join(root, "README.md");
  if (!(await pathExists(readme))) {
    await fsp.writeFile(
      readme,
      [
        "# DM Library data",
        "",
        "Authoritative user library for this local app.",
        "",
        "**Privacy:** committing `/data` versions your personal campaign and catalogue content.",
        "This repo is intended to be private; treat Git history as intentional backup, not disposable scratch.",
        "",
        "Do not put secrets or credentials here.",
        ""
      ].join("\n"),
      "utf8"
    );
  }
}

module.exports = {
  projectRoot,
  dataRoot,
  backupRoot,
  ensureDir,
  ensureDataLayout,
  assertInsideData,
  writeJsonAtomic,
  readJson,
  writeBinaryAtomic,
  removeFile,
  pathExists,
  listJsonFiles,
  backupExisting
};
