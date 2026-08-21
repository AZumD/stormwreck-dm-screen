/**
 * Optional Postgres pool. When DATABASE_URL is unset, returns null (file mode).
 */
let pool = null;
let poolPromise = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || "";
}

function isDbConfigured() {
  return Boolean(getDatabaseUrl());
}

async function getPool() {
  if (!isDbConfigured()) return null;
  if (pool) return pool;
  if (poolPromise) return poolPromise;

  poolPromise = (async () => {
    const pg = await import("pg");
    const { Pool } = pg.default || pg;
    pool = new Pool({ connectionString: getDatabaseUrl() });
    pool.on("error", (err) => {
      console.warn("Postgres pool error:", err.message);
    });
    return pool;
  })();

  return poolPromise;
}

async function query(text, params) {
  const p = await getPool();
  if (!p) throw new Error("DATABASE_URL is not configured");
  return p.query(text, params);
}

async function health() {
  if (!isDbConfigured()) {
    return { configured: false, ok: false, mode: "file" };
  }
  try {
    const result = await query("SELECT 1 AS ok");
    return {
      configured: true,
      ok: result.rows?.[0]?.ok === 1,
      mode: "postgres"
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      mode: "postgres",
      error: String(err.message || err)
    };
  }
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
    poolPromise = null;
  }
}

module.exports = {
  isDbConfigured,
  getPool,
  query,
  health,
  close
};
