"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { projectRoot, dataRoot } = require("./atomic-fs");

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listSeedFiles(root) {
  if (!(await pathExists(root))) return [];
  const out = [];

  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        out.push(full);
      }
    }
  }

  await walk(root);
  return out;
}

/**
 * Add newly committed catalogue seed files to a persistent DM_DATA_ROOT.
 * Existing destination files are NEVER overwritten: live/user edits always win.
 * Campaigns and assets are intentionally outside this sync.
 */
async function syncMissingCatalogueSeeds({
  sourceRoot = path.join(projectRoot(), "data", "catalogues"),
  destRoot = path.join(dataRoot(), "catalogues")
} = {}) {
  const source = path.resolve(sourceRoot);
  const destination = path.resolve(destRoot);

  if (source === destination) {
    return { ok: true, seeded: 0, skipped: 0, source, destination, local: true };
  }

  const seedFiles = await listSeedFiles(source);
  let seeded = 0;
  let skipped = 0;

  for (const from of seedFiles) {
    const rel = path.relative(source, from);
    const to = path.join(destination, rel);
    await fsp.mkdir(path.dirname(to), { recursive: true });
    try {
      await fsp.copyFile(from, to, fs.constants.COPYFILE_EXCL);
      seeded += 1;
    } catch (err) {
      if (err && err.code === "EEXIST") {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  return { ok: true, seeded, skipped, source, destination, local: false };
}

module.exports = {
  listSeedFiles,
  syncMissingCatalogueSeeds
};