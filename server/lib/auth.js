/**
 * Phase 3A authentication: bcrypt passwords + Postgres server sessions + HttpOnly cookies.
 * Never log raw session tokens. Store only SHA-256(token) in Postgres.
 */
"use strict";

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("./db");

const COOKIE_NAME = "sw_session";
const BCRYPT_ROUNDS = 10;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Fail closed in production. Locally AUTH_REQUIRED=1 forces auth; AUTH_REQUIRED=0 (default) keeps DM APIs open.
 */
function isAuthRequired() {
  if (isProduction()) return true;
  const raw = String(process.env.AUTH_REQUIRED || "0").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function sessionTtlMs() {
  const days = Number(process.env.SESSION_TTL_DAYS) || 14;
  return Math.max(1, days) * 24 * 60 * 60 * 1000;
}

function cookieSecure() {
  if (process.env.COOKIE_SECURE === "1" || process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "0" || process.env.COOKIE_SECURE === "false") return false;
  return isProduction() || process.env.TRUST_PROXY === "1";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashToken(rawToken) {
  const pepper = process.env.SESSION_SECRET || "";
  return crypto.createHash("sha256").update(`${pepper}:${rawToken}`).digest("hex");
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function parseCookies(req) {
  const header = req.headers?.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function buildSessionCookie(rawToken, { clear = false } = {}) {
  const secure = cookieSecure();
  const maxAge = clear ? 0 : Math.floor(sessionTtlMs() / 1000);
  const parts = [
    `${COOKIE_NAME}=${clear ? "" : encodeURIComponent(rawToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ];
  if (secure) parts.push("Secure");
  if (clear) parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return parts.join("; ");
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
  } else {
    res.setHeader("Set-Cookie", [existing, cookie]);
  }
}

function requireAuthConfig() {
  if (!isAuthRequired()) return;
  if (!db.isDbConfigured()) {
    throw new Error("AUTH: DATABASE_URL is required when authentication is required");
  }
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 32) {
    throw new Error("AUTH: SESSION_SECRET must be set to at least 32 characters when authentication is required");
  }
}

async function cleanupExpiredSessions() {
  if (!db.isDbConfigured()) return;
  await db.query("DELETE FROM sessions WHERE expires_at < now()");
}

async function hashPassword(password) {
  return bcrypt.hash(String(password), BCRYPT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  return bcrypt.compare(String(password), passwordHash);
}

async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const result = await db.query(
    `SELECT id, name, email, password_hash, auth_subject, created_at, updated_at
     FROM users
     WHERE email IS NOT NULL AND lower(btrim(email)) = $1
     LIMIT 1`,
    [normalized]
  );
  return result.rows[0] || null;
}

async function getUserById(userId) {
  const result = await db.query(
    `SELECT id, name, email, auth_subject, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function createSession(userId) {
  await cleanupExpiredSessions();
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + sessionTtlMs());
  await db.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt.toISOString()]
  );
  return { rawToken, expiresAt };
}

async function destroySessionByToken(rawToken) {
  if (!rawToken) return false;
  const tokenHash = hashToken(rawToken);
  const result = await db.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
  return (result.rowCount || 0) > 0;
}

async function destroySessionsForUser(userId) {
  await db.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

/**
 * Resolve authenticated user from cookie. Returns null if missing/invalid/expired.
 * Opportunistically cleans expired sessions.
 */
async function resolveSessionUser(req) {
  if (!db.isDbConfigured()) return null;
  const cookies = parseCookies(req);
  const rawToken = cookies[COOKIE_NAME];
  if (!rawToken) return null;

  await cleanupExpiredSessions();

  const tokenHash = hashToken(rawToken);
  const result = await db.query(
    `SELECT s.id AS session_id, s.expires_at, u.id, u.name, u.email, u.auth_subject
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.query("DELETE FROM sessions WHERE id = $1", [row.session_id]);
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    auth_subject: row.auth_subject,
    sessionId: row.session_id
  };
}

async function loginWithPassword(email, password) {
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  const session = await createSession(user.id);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    rawToken: session.rawToken,
    expiresAt: session.expiresAt
  };
}

async function listMemberships(userId) {
  const result = await db.query(
    `SELECT campaign_id, role, created_at
     FROM campaign_memberships
     WHERE user_id = $1
     ORDER BY campaign_id`,
    [userId]
  );
  return result.rows.map((r) => ({
    campaignId: r.campaign_id,
    role: r.role,
    createdAt: r.created_at
  }));
}

module.exports = {
  COOKIE_NAME,
  isProduction,
  isAuthRequired,
  requireAuthConfig,
  normalizeEmail,
  hashPassword,
  verifyPassword,
  findUserByEmail,
  getUserById,
  createSession,
  destroySessionByToken,
  destroySessionsForUser,
  resolveSessionUser,
  loginWithPassword,
  listMemberships,
  parseCookies,
  buildSessionCookie,
  appendSetCookie,
  cleanupExpiredSessions,
  cookieSecure,
  hashToken
};
