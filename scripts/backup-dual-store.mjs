/**
 * Dual-store backup helper for Railway hybrid deploy.
 * Archives DM_DATA_ROOT (volume) and optionally runs pg_dump when DATABASE_URL is set.
 *
 * Never wires into npm start. Safe to run while the app is stopped or briefly paused.
 *
 * Usage:
 *   DM_DATA_ROOT=/data BACKUP_DIR=./.backup-out node scripts/backup-dual-store.mjs
 *   npm run backup:dual
 */
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(
    d.getUTCMinutes()
  )}${p(d.getUTCSeconds())}Z`;
}

const dataRoot = String(process.env.DM_DATA_ROOT || "").trim();
if (!dataRoot) die("DM_DATA_ROOT is required (volume path to archive).");

const outBase = String(process.env.BACKUP_DIR || path.join(root, ".backup-out")).trim();
const label = stamp();
const dest = path.join(outBase, `dual-${label}`);

await fsp.mkdir(dest, { recursive: true });

const checklist = [
  "1. Keep Postgres dump + volume tar together for restore.",
  "2. Restore Postgres first (or volume first) — never mix mismatched ages.",
  "3. After restore: confirm GET /api/health, DM login, player sheet, music playback.",
  "4. Do not run data:init over a restored live volume."
];
await fsp.writeFile(path.join(dest, "CHECKLIST.txt"), checklist.join("\n") + "\n", "utf8");

const volumeTar = path.join(dest, "volume-data.tar");
console.log(`Archiving volume ${dataRoot} → ${volumeTar}`);
const tar = spawnSync(
  "tar",
  ["-cf", volumeTar, "-C", dataRoot, "."],
  { encoding: "utf8", shell: process.platform === "win32" }
);
if (tar.status !== 0) {
  die(`tar failed: ${tar.stderr || tar.stdout || tar.error?.message || "unknown"}`);
}

const databaseUrl = String(process.env.DATABASE_URL || "").trim();
if (databaseUrl) {
  const dumpPath = path.join(dest, "postgres.dump");
  console.log(`pg_dump → ${dumpPath}`);
  const dump = spawnSync("pg_dump", ["--format=custom", "--file", dumpPath, databaseUrl], {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env
  });
  if (dump.status !== 0) {
    console.warn(
      `pg_dump skipped/failed (install client tools or dump manually): ${
        dump.stderr || dump.stdout || dump.error?.message || "unknown"
      }`
    );
    await fsp.writeFile(
      path.join(dest, "POSTGRES-MANUAL.txt"),
      "pg_dump failed here. Run: pg_dump --format=custom --file=postgres.dump \"$DATABASE_URL\"\n",
      "utf8"
    );
  }
} else {
  await fsp.writeFile(
    path.join(dest, "POSTGRES-SKIPPED.txt"),
    "DATABASE_URL unset — volume archive only. Pair with a Railway Postgres snapshot.\n",
    "utf8"
  );
}

const manifest = {
  createdAt: new Date().toISOString(),
  dataRoot,
  volumeTar: path.basename(volumeTar),
  hasDatabaseUrl: Boolean(databaseUrl),
  checklist
};
await fsp.writeFile(path.join(dest, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`Backup written to ${dest}`);
console.log(checklist.join("\n"));
