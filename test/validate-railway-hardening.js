/**
 * Phase 4B Railway hardening tests.
 * Run: node test/validate-railway-hardening.js
 *
 * Covers: DM_DATA_ROOT resolution, item seed path, data:init safety,
 * graceful shutdown hooks, production DM_DATA_ROOT validation,
 * authenticated campaign create → FS + Postgres + DM membership,
 * file-only campaign create still works.
 */
"use strict";

require("dotenv").config();
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const http = require("http");
const os = require("os");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

function clearServerCache() {
  Object.keys(require.cache).forEach((key) => {
    const norm = key.replace(/\\/g, "/");
    if (
      norm.includes("/server/") ||
      norm.includes("/scripts/") ||
      norm.includes("/db/seed-items")
    ) {
      delete require.cache[key];
    }
  });
}

async function withTempEnv(envPatch, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(envPatch)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  clearServerCache();
  try {
    return await fn();
  } finally {
    for (const [k, prev] of Object.entries(saved)) {
      if (prev === undefined) delete process.env[k];
      else process.env[k] = prev;
    }
    clearServerCache();
  }
}

/* —— Static wiring —— */
const requiredFiles = [
  "server/lib/startup-config.js",
  "server/lib/shutdown.js",
  "scripts/data-init.mjs",
  "docs/README/DEPLOY.md",
  "docs/README/DATA-INIT.md",
  "docs/README/VALIDATE-RAILWAY-HARDENING.md"
];
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`file ${rel}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.scripts?.["data:init"] !== "node scripts/data-init.mjs") fail("package.json data:init");
else pass("package.json data:init");
if (!pkg.scripts?.test?.includes("validate-railway-hardening")) {
  fail("npm test missing validate-railway-hardening");
} else pass("npm test includes railway hardening");
if (pkg.scripts?.start?.includes("seed:characters") || pkg.scripts?.start?.includes("data:init")) {
  fail("npm start must not auto-run seed/data:init");
} else pass("npm start has no auto seed/init");

const indexSrc = fs.readFileSync(path.join(root, "server/index.js"), "utf8");
if (!indexSrc.includes("validateStartupConfig") || !indexSrc.includes("registerShutdownHandlers")) {
  fail("server/index.js missing startup/shutdown wiring");
} else pass("server index startup + shutdown");
if (!indexSrc.includes("dataRoot()") || !indexSrc.includes("Data directory:")) {
  fail("server index must log resolved dataRoot");
} else pass("server logs resolved data directory");

const seedItems = fs.readFileSync(path.join(root, "db/seed-items.mjs"), "utf8");
if (!seedItems.includes("dataRoot") || !seedItems.includes("resolveItemCatalogueDir")) {
  fail("seed-items must use dataRoot / resolveItemCatalogueDir");
} else pass("seed-items respects DM_DATA_ROOT");

const seedChars = fs.readFileSync(path.join(root, "db/seed-characters.mjs"), "utf8");
if (!seedChars.includes("overwrite live HP") && !seedChars.includes("WARNING")) {
  fail("seed-characters missing overwrite warning");
} else pass("seed-characters warns about HP overwrite");

const healthSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!healthSrc.includes("healthy ? 200 : 503") && !healthSrc.includes("503")) {
  fail("health route should 503 when auth-required DB unhealthy");
} else pass("health route production-aware");
if (!healthSrc.includes("ensurePostgresCampaignAndDm")) {
  fail("POST /api/campaigns missing Postgres sync");
} else pass("campaign create syncs Postgres when auth+db");
if (!healthSrc.includes("volume.writable") || !healthSrc.includes("schema.complete")) {
  fail("health missing volume writability / schema probe");
} else pass("health probes volume + schema completeness");
if (!healthSrc.includes("db:migrate")) {
  fail("health missing migrate hint");
} else pass("health migrate hint when schema incomplete");

const shutdownSrc = fs.readFileSync(path.join(root, "server/lib/shutdown.js"), "utf8");
if (!shutdownSrc.includes("timeoutMs") || !shutdownSrc.includes("timed out")) {
  fail("shutdown missing hard timeout");
} else pass("shutdown has hard timeout");

const backupScript = path.join(root, "scripts/backup-dual-store.mjs");
const backupDoc = path.join(root, "docs/README/BACKUP-DUAL-STORE.md");
if (!fs.existsSync(backupScript) || !fs.existsSync(backupDoc)) {
  fail("dual-store backup script/docs missing");
} else pass("dual-store backup script + docs");

if (!pkg.scripts?.["backup:dual"]) fail("package.json missing backup:dual script");
else pass("npm run backup:dual wired");

/* —— Unit: resolveHost / validateStartupConfig —— */
async function unitStartup() {
  await withTempEnv({ NODE_ENV: undefined, HOST: undefined }, () => {
    const { resolveHost } = require("../server/lib/startup-config");
    if (resolveHost() !== "127.0.0.1") fail(`local host default got ${resolveHost()}`);
    else pass("local HOST default 127.0.0.1");
  });

  await withTempEnv({ NODE_ENV: "production", HOST: undefined }, () => {
    const { resolveHost } = require("../server/lib/startup-config");
    if (resolveHost() !== "0.0.0.0") fail(`prod host default got ${resolveHost()}`);
    else pass("production HOST default 0.0.0.0");
  });

  await withTempEnv({ NODE_ENV: "production", HOST: "127.0.0.1" }, () => {
    const { resolveHost } = require("../server/lib/startup-config");
    if (resolveHost() !== "127.0.0.1") fail("explicit HOST should win");
    else pass("explicit HOST overrides production default");
  });

  await withTempEnv(
    {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      SESSION_SECRET: "x".repeat(32),
      DM_DATA_ROOT: undefined
    },
    () => {
      const { validateStartupConfig } = require("../server/lib/startup-config");
      let threw = false;
      try {
        validateStartupConfig();
      } catch (err) {
        threw = /DM_DATA_ROOT/i.test(String(err.message || err));
      }
      if (!threw) fail("production missing DM_DATA_ROOT should throw");
      else pass("production missing DM_DATA_ROOT fails startup validation");
    }
  );

  const tmpData = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-prod-ok-"));
  await withTempEnv(
    {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      SESSION_SECRET: "y".repeat(32),
      DM_DATA_ROOT: tmpData,
      HOST: "0.0.0.0"
    },
    () => {
      const { validateStartupConfig } = require("../server/lib/startup-config");
      const cfg = validateStartupConfig();
      if (cfg.host !== "0.0.0.0") fail("prod validate host");
      else pass("production with DM_DATA_ROOT validates");
    }
  );

  await withTempEnv({ NODE_ENV: undefined, AUTH_REQUIRED: "0", DM_DATA_ROOT: undefined }, () => {
    const { validateStartupConfig } = require("../server/lib/startup-config");
    validateStartupConfig();
    pass("local startup allows missing DM_DATA_ROOT");
  });
}

/* —— Unit: dataRoot resolution —— */
async function unitDataRoot() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-root-"));
  await withTempEnv({ DM_DATA_ROOT: tmp }, () => {
    const { dataRoot } = require("../server/lib/atomic-fs");
    if (path.resolve(dataRoot()) !== path.resolve(tmp)) fail("dataRoot ignores DM_DATA_ROOT");
    else pass("dataRoot resolves DM_DATA_ROOT");
  });

  await withTempEnv({ DM_DATA_ROOT: undefined }, () => {
    const { dataRoot, projectRoot } = require("../server/lib/atomic-fs");
    const expected = path.join(projectRoot(), "data");
    if (path.resolve(dataRoot()) !== path.resolve(expected)) fail("default dataRoot");
    else pass("dataRoot defaults to repo/data");
  });
}

/* —— Item seed alternate root —— */
async function unitSeedItemsPath() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-items-"));
  const itemDir = path.join(tmp, "catalogues", "item");
  await fsp.mkdir(itemDir, { recursive: true });
  await fsp.writeFile(
    path.join(itemDir, "test-item.json"),
    JSON.stringify({ id: "test-item", name: "Test Item" }),
    "utf8"
  );

  await withTempEnv({ DM_DATA_ROOT: tmp }, async () => {
    const { pathToFileURL } = require("url");
    const mod = await import(`${pathToFileURL(path.join(root, "db/seed-items.mjs")).href}?t=${Date.now()}`);
    const resolved = mod.resolveItemCatalogueDir();
    if (path.resolve(resolved) !== path.resolve(itemDir)) {
      fail(`item seed dir expected ${itemDir} got ${resolved}`);
    } else pass("item seed reads from alternate DM_DATA_ROOT");
  });
}

/* —— data:init —— */
async function unitDataInit() {
  const { pathToFileURL } = require("url");
  const { initDataVolume, isVolumeInitialized } = await import(
    `${pathToFileURL(path.join(root, "scripts/data-init.mjs")).href}?t=${Date.now()}`
  );

  const destEmpty = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-vol-empty-"));
  const result = await initDataVolume({
    sourceRoot: path.join(root, "data"),
    destRoot: destEmpty
  });
  if (!result.ok) fail(`data:init empty failed: ${result.message}`);
  else pass("data:init empty volume succeeds");

  if (!(await fs.promises.access(path.join(destEmpty, ".initialized")).then(() => true).catch(() => false))) {
    fail("data:init missing .initialized marker");
  } else pass("data:init wrote .initialized");

  const campIdx = path.join(destEmpty, "campaigns", "index.json");
  if (!fs.existsSync(campIdx)) fail("data:init missing campaigns/index.json");
  else pass("data:init copied campaign seed");

  const again = await initDataVolume({
    sourceRoot: path.join(root, "data"),
    destRoot: destEmpty
  });
  if (!again.refused) fail("second data:init should refuse");
  else pass("data:init second run refuses overwrite");

  const destPartial = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-vol-partial-"));
  await fsp.mkdir(path.join(destPartial, "catalogues", "item"), { recursive: true });
  await fsp.writeFile(path.join(destPartial, "catalogues", "item", "x.json"), "{}\n");
  const state = await isVolumeInitialized(destPartial);
  if (!state.initialized) fail("non-empty catalogues should count as initialized");
  else pass("non-empty destination detected as initialized");

  const refused = await initDataVolume({
    sourceRoot: path.join(root, "data"),
    destRoot: destPartial
  });
  if (!refused.refused) fail("data:init should refuse non-empty dest");
  else pass("data:init refuses non-empty volume");

  const same = await initDataVolume({
    sourceRoot: path.join(root, "data"),
    destRoot: path.join(root, "data")
  });
  if (!same.refused || same.reason !== "source_equals_destination") {
    fail("data:init should refuse source===dest");
  } else pass("data:init refuses source equals destination");
}

/* —— Graceful shutdown —— */
async function unitShutdown() {
  const { registerShutdownHandlers } = require("../server/lib/shutdown");
  const server = http.createServer((_req, res) => res.end("ok"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  let dbClosed = false;
  let signals = [];
  const ctl = registerShutdownHandlers(server, {
    closeDb: async () => {
      dbClosed = true;
    },
    exit: false,
    onSignal: (s) => signals.push(s)
  });

  await ctl.shutdown("SIGTERM");
  if (!ctl.isShuttingDown()) fail("isShuttingDown after shutdown");
  else pass("shutdown marks shuttingDown");
  if (!dbClosed) fail("closeDb not called");
  else pass("shutdown closes db pool hook");

  dbClosed = false;
  await ctl.shutdown("SIGTERM");
  if (dbClosed) fail("second shutdown should no-op");
  else pass("shutdown is idempotent");

  ctl.unregister();
  await new Promise((resolve) => {
    if (!server.listening) resolve();
    else server.close(() => resolve());
  });
}

/* —— File-only campaign create —— */
async function unitFileOnlyCampaign() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-camp-file-"));
  await withTempEnv(
    { DM_DATA_ROOT: tmp, AUTH_REQUIRED: "0", NODE_ENV: undefined, DATABASE_URL: undefined },
    async () => {
      const atomic = require("../server/lib/atomic-fs");
      await atomic.ensureDataLayout();
      const campaigns = require("../server/lib/campaigns");
      const entry = await campaigns.createCampaign({ title: "File Only Camp", description: "x" });
      if (!entry?.id) fail("file-only createCampaign");
      else pass("file-only createCampaign works");
      const got = await campaigns.getCampaign(entry.id);
      if (!got || got.title !== "File Only Camp") fail("file-only getCampaign");
      else pass("file-only campaign readable from FS");
    }
  );
}

/* —— Live: authenticated campaign create sync —— */
async function liveCampaignSync() {
  if (!process.env.DATABASE_URL) {
    pass("live campaign sync skipped (DATABASE_URL unset)");
    return;
  }

  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-camp-auth-"));
  const suffix = crypto.randomBytes(4).toString("hex");
  const seedCampaignId = `camp-seed-${suffix}`;
  const dmEmail = `dm-create-${suffix}@example.local`;
  const password = `CreatePass-${suffix}!`;

  await withTempEnv(
    {
      DM_DATA_ROOT: tmp,
      AUTH_REQUIRED: "1",
      NODE_ENV: undefined,
      SESSION_SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex")
    },
    async () => {
      const atomic = require("../server/lib/atomic-fs");
      await atomic.ensureDataLayout();
      const auth = require("../server/lib/auth");
      const db = require("../server/lib/db");
      const campaigns = require("../server/lib/campaigns");
      const authorize = require("../server/lib/authorize");
      const { createApiRoutes, handleApi } = require("../server/routes/api");
      const guard = require("./lib/dev-data-guard");

      const health = await db.health();
      if (!health.ok) {
        fail(`postgres not reachable: ${health.error || "unknown"}`);
        return;
      }

      const altharielBefore = await guard.snapshotAlthariel(db);

      const hash = await auth.hashPassword(password);
      const dmIns = await db.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        ["Create DM", auth.normalizeEmail(dmEmail), hash]
      );
      const dmId = dmIns.rows[0].id;
      await db.query(
        `INSERT INTO campaigns (id, name, description, game_system_id) VALUES ($1, $2, $3, $4)`,
        [seedCampaignId, "Seed for any-dm", "", "dnd5e"]
      );
      await db.query(
        `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1, $2, 'dm')`,
        [seedCampaignId, dmId]
      );

      const login = await auth.loginWithPassword(dmEmail, password);
      const sessionCookie = `${auth.COOKIE_NAME}=${login.rawToken}`;

      const apiRoutes = createApiRoutes();
      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url || "/", "http://127.0.0.1");
          const handled = await handleApi(req, res, url.pathname, apiRoutes);
          if (!handled) {
            res.writeHead(404);
            res.end();
          }
        } catch (err) {
          res.writeHead(err.status || 500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const { port } = server.address();

      const body = JSON.stringify({
        title: `Auth Synced ${suffix}`,
        description: "phase4b"
      });
      const created = await new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: "/api/campaigns",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
              Cookie: sessionCookie,
              Origin: `http://127.0.0.1:${port}`,
              Host: `127.0.0.1:${port}`
            }
          },
          (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
              try {
                resolve({ status: res.statusCode, json: JSON.parse(data || "{}") });
              } catch (e) {
                reject(e);
              }
            });
          }
        );
        req.on("error", reject);
        req.write(body);
        req.end();
      });

      if (created.status !== 201 || !created.json?.campaign?.id) {
        fail(`authenticated create status ${created.status} ${JSON.stringify(created.json)}`);
      } else pass("authenticated POST /api/campaigns returns 201");

      const newId = created.json.campaign.id;
      const fsEntry = await campaigns.getCampaign(newId);
      if (!fsEntry) fail("FS campaign missing after auth create");
      else pass("FS campaign present after auth create");

      const pgCamp = await db.query("SELECT id, name FROM campaigns WHERE id = $1", [newId]);
      if (!pgCamp.rows.length) fail("Postgres campaigns row missing");
      else pass("Postgres campaigns row created");

      const mem = await db.query(
        `SELECT role FROM campaign_memberships WHERE campaign_id = $1 AND user_id = $2`,
        [newId, dmId]
      );
      if (!mem.rows.length || mem.rows[0].role !== "dm") fail("DM membership missing");
      else pass("creator has DM membership");

      const fakeReq = {
        method: "GET",
        headers: {
          cookie: sessionCookie,
          host: `127.0.0.1:${port}`
        }
      };
      try {
        await authorize.requireDm(fakeReq, newId);
        pass("new campaign immediately authorized for creating DM");
      } catch (err) {
        fail(`requireDm on new campaign failed: ${err.message}`);
      }

      await db.query("DELETE FROM campaigns WHERE id = $1", [newId]);
      await db.query("DELETE FROM campaigns WHERE id = $1", [seedCampaignId]);
      await db.query("DELETE FROM users WHERE id = $1", [dmId]);
      await guard.assertAltharielUnchanged(db, altharielBefore, "railway-hardening");

      await new Promise((resolve) => server.close(() => resolve()));
    }
  );
}

(async () => {
  try {
    await unitStartup();
    await unitDataRoot();
    await unitSeedItemsPath();
    await unitDataInit();
    await unitShutdown();
    await unitFileOnlyCampaign();
    await liveCampaignSync();
  } catch (err) {
    fail(err.stack || err.message || String(err));
  }

  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll railway-hardening checks passed.");
})();
