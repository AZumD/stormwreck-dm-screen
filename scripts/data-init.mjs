/**
 * One-shot: copy committed repo `data/` seed onto an empty DM_DATA_ROOT volume.
 *
 * Usage:
 *   DM_DATA_ROOT=/data npm run data:init
 *
 * NEVER run this over a live volume that already holds campaign data.
 * NEVER wire this into `npm start` or automatic deploy hooks.
 *
 * Safe to re-run: second run refuses when `.initialized` exists or destination
 * already contains catalogues / campaigns.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);
const { projectRoot, dataRoot } = require("../server/lib/atomic-fs.js");

const MARKER = ".initialized";

function sourceDataRoot() {
  return path.join(projectRoot(), "data");
}

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function countJsonUnder(dir) {
  if (!(await pathExists(dir))) return 0;
  let count = 0;
  async function walk(d) {
    const entries = await fsp.readdir(d, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) await walk(full);
      else if (ent.isFile() && ent.name.endsWith(".json")) count += 1;
    }
  }
  await walk(dir);
  return count;
}

/**
 * Destination is initialized if marker exists OR any catalogue/campaign JSON is present.
 */
export async function isVolumeInitialized(destRoot) {
  if (await pathExists(path.join(destRoot, MARKER))) return { initialized: true, reason: "marker" };
  const catalogues = await countJsonUnder(path.join(destRoot, "catalogues"));
  if (catalogues > 0) return { initialized: true, reason: "catalogues", count: catalogues };
  const campaigns = await countJsonUnder(path.join(destRoot, "campaigns"));
  if (campaigns > 0) return { initialized: true, reason: "campaigns", count: campaigns };
  return { initialized: false };
}

async function copyDirFiltered(src, dest, { skipNames = new Set() } = {}) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  let files = 0;
  let dirs = 0;
  for (const ent of entries) {
    if (skipNames.has(ent.name)) continue;
    if (ent.name === ".env" || ent.name.startsWith(".env.")) continue;
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === ".backup" || ent.name === "node_modules") continue;
      const sub = await copyDirFiltered(from, to, { skipNames });
      files += sub.files;
      dirs += sub.dirs + 1;
    } else if (ent.isFile()) {
      await fsp.mkdir(path.dirname(to), { recursive: true });
      await fsp.copyFile(from, to);
      files += 1;
    }
  }
  return { files, dirs };
}

export async function initDataVolume({
  sourceRoot = sourceDataRoot(),
  destRoot = dataRoot(),
  force = false
} = {}) {
  const src = path.resolve(sourceRoot);
  const dest = path.resolve(destRoot);

  if (src === dest) {
    return {
      ok: false,
      refused: true,
      reason: "source_equals_destination",
      message: `Refusing: source and destination are the same (${dest}). Set DM_DATA_ROOT to the empty volume path.`
    };
  }

  if (!(await pathExists(src))) {
    return {
      ok: false,
      refused: true,
      reason: "missing_source",
      message: `Source data missing: ${src}`
    };
  }

  const state = await isVolumeInitialized(dest);
  if (state.initialized && !force) {
    return {
      ok: false,
      refused: true,
      reason: state.reason,
      message: `Refusing: destination already initialized (${state.reason}). Never overwrite a live volume. Dest=${dest}`
    };
  }

  await fsp.mkdir(dest, { recursive: true });

  const catalogues = await copyDirFiltered(path.join(src, "catalogues"), path.join(dest, "catalogues"));
  const campaigns = await copyDirFiltered(path.join(src, "campaigns"), path.join(dest, "campaigns"));

  /* Ensure mutable asset layout; copy seed assets if present */
  await fsp.mkdir(path.join(dest, "assets", "portraits"), { recursive: true });
  await fsp.mkdir(path.join(dest, "assets", "maps"), { recursive: true });
  let assets = { files: 0, dirs: 0 };
  if (await pathExists(path.join(src, "assets"))) {
    assets = await copyDirFiltered(path.join(src, "assets"), path.join(dest, "assets"));
  }

  /* Optional README from seed */
  const readmeSrc = path.join(src, "README.md");
  if (await pathExists(readmeSrc)) {
    await fsp.copyFile(readmeSrc, path.join(dest, "README.md"));
  }

  const markerBody = [
    "Stormwreck DM Library volume initialized",
    `source=${src}`,
    `dest=${dest}`,
    `at=${new Date().toISOString()}`,
    ""
  ].join("\n");
  await fsp.writeFile(path.join(dest, MARKER), markerBody, "utf8");

  return {
    ok: true,
    refused: false,
    source: src,
    destination: dest,
    copied: {
      catalogues,
      campaigns,
      assets
    },
    marker: MARKER
  };
}

async function main() {
  if (!process.env.DM_DATA_ROOT || String(process.env.DM_DATA_ROOT).trim() === "") {
    console.error("DM_DATA_ROOT must be set to the empty volume path (e.g. /data).");
    console.error("Refusing to run against the default repo data/ directory.");
    process.exit(1);
  }

  const result = await initDataVolume();
  if (!result.ok) {
    console.error(result.message);
    process.exit(2);
  }

  console.log("data:init completed");
  console.log(`  source:      ${result.source}`);
  console.log(`  destination: ${result.destination}`);
  console.log(
    `  catalogues:  ${result.copied.catalogues.files} files / ${result.copied.catalogues.dirs} dirs`
  );
  console.log(
    `  campaigns:   ${result.copied.campaigns.files} files / ${result.copied.campaigns.dirs} dirs`
  );
  console.log(`  assets:      ${result.copied.assets.files} files / ${result.copied.assets.dirs} dirs`);
  console.log(`  marker:      ${result.marker}`);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
