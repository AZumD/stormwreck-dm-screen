"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { projectRoot, dataRoot } = require("./atomic-fs");
const characterCreatorSeeds = require("../seeds/character-creator-compendium");

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

function assertSeedPart(value, label) {
  const text = String(value || "").trim();
  if (!/^[a-z0-9-]+$/.test(text)) throw new Error(`Invalid ${label} in built-in catalogue seed: ${value}`);
  return text;
}

async function materializeManifestSeeds(destination) {
  let seeded = 0;
  let skipped = 0;

  for (const seed of characterCreatorSeeds) {
    const type = assertSeedPart(seed.type, "type");
    const id = assertSeedPart(seed.id, "id");
    const dir = path.join(destination, type);
    const to = path.join(dir, `${id}.json`);
    await fsp.mkdir(dir, { recursive: true });
    try {
      await fsp.writeFile(to, `${JSON.stringify(seed.entry, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      seeded += 1;
    } catch (err) {
      if (err && err.code === "EEXIST") {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  return { seeded, skipped };
}

/**
 * Add newly committed catalogue seed files and built-in seed-manifest entries to
 * DM_DATA_ROOT. Existing files are NEVER overwritten: live/user edits always win.
 * Campaigns and assets are intentionally outside this sync.
 */
async function syncMissingCatalogueSeeds({
  sourceRoot = path.join(projectRoot(), "data", "catalogues"),
  destRoot = path.join(dataRoot(), "catalogues")
} = {}) {
  const source = path.resolve(sourceRoot);
  const destination = path.resolve(destRoot);
  let seeded = 0;
  let skipped = 0;

  if (source !== destination) {
    const seedFiles = await listSeedFiles(source);
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
  }

  const manifest = await materializeManifestSeeds(destination);
  seeded += manifest.seeded;
  skipped += manifest.skipped;

  return {
    ok: true,
    seeded,
    skipped,
    source,
    destination,
    local: source === destination,
    manifestSeeded: manifest.seeded,
    manifestSkipped: manifest.skipped
  };
}

module.exports = {
  listSeedFiles,
  materializeManifestSeeds,
  syncMissingCatalogueSeeds
};