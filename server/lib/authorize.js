/**
 * Phase 3A authorization helpers. Every check derives from the authenticated user.
 * Never authorize from campaign/character id possession alone.
 */
"use strict";

const db = require("./db");
const auth = require("./auth");

function deny(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * CSRF hardening for authenticated mutations:
 * - Content-Type must be application/json OR an allowlisted binary upload type
 *   (music MP3 uploads use audio/mpeg). DELETE with no body may omit Content-Type.
 * - If Origin is present, it must match Host / X-Forwarded-Host (same-origin)
 */
function normalizeHost(host) {
  return String(host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:443$/, "")
    .replace(/:80$/, "");
}

function requestHosts(req) {
  const hosts = new Set();
  const trustProxy =
    process.env.TRUST_PROXY === "1" ||
    String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const primary = normalizeHost(req.headers.host);
  if (primary) hosts.add(primary);
  if (trustProxy) {
    const xf = normalizeHost(req.headers["x-forwarded-host"]);
    if (xf) hosts.add(xf);
  }
  return hosts;
}

function isAllowedMutationContentType(contentType) {
  const ct = String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ct) return false;
  if (ct === "application/json" || ct.endsWith("+json") || ct.includes("json")) return true;
  if (ct === "application/octet-stream") return true;
  if (ct.startsWith("audio/")) return true;
  return false;
}

function assertMutationSafety(req) {
  const method = (req.method || "GET").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;

  const contentType = String(req.headers["content-type"] || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  /* DELETE often has no body — browsers omit Content-Type. Allow empty for DELETE only. */
  if (!contentType) {
    if (method !== "DELETE") {
      deny(415, "Content-Type must be application/json (or an allowed binary upload type)");
    }
  } else if (!isAllowedMutationContentType(contentType)) {
    deny(415, "Content-Type must be application/json (or an allowed binary upload type)");
  }

  const origin = req.headers.origin;
  if (origin) {
    let originHost;
    try {
      originHost = normalizeHost(new URL(origin).host);
    } catch {
      deny(403, "Invalid Origin");
    }
    const hosts = requestHosts(req);
    if (!originHost || !hosts.has(originHost)) {
      deny(403, "Cross-origin request rejected");
    }
  }
}

async function requireUser(req) {
  assertMutationSafety(req);
  const user = await auth.resolveSessionUser(req);
  if (!user) deny(401, "Authentication required");
  req.user = user;
  return user;
}

/**
 * When auth is required, demand a session user. When not required (local DM), return null.
 */
async function requireUserIfAuthRequired(req) {
  if (!auth.isAuthRequired()) {
    if (["POST", "PUT", "PATCH", "DELETE"].includes((req.method || "GET").toUpperCase())) {
      /* Still apply mutation Content-Type when a session cookie is present */
      const cookies = auth.parseCookies(req);
      if (cookies[auth.COOKIE_NAME]) assertMutationSafety(req);
    }
    return null;
  }
  return requireUser(req);
}

async function getMembership(userId, campaignId) {
  const result = await db.query(
    `SELECT id, campaign_id, user_id, role, created_at
     FROM campaign_memberships
     WHERE user_id = $1 AND campaign_id = $2
     LIMIT 1`,
    [userId, campaignId]
  );
  return result.rows[0] || null;
}

async function requireCampaignMember(req, campaignId) {
  const user = await requireUser(req);
  const membership = await getMembership(user.id, campaignId);
  if (!membership) deny(403, "Not a member of this campaign");
  req.membership = membership;
  return { user, membership };
}

async function requireDm(req, campaignId) {
  const { user, membership } = await requireCampaignMember(req, campaignId);
  if (membership.role !== "dm") deny(403, "DM access required");
  return { user, membership };
}

/**
 * Global DM-library endpoints (catalogues, export) have no campaignId.
 * Require the user to be a DM of at least one campaign.
 */
async function requireAnyDm(req) {
  const user = await requireUser(req);
  const result = await db.query(
    `SELECT campaign_id, role
     FROM campaign_memberships
     WHERE user_id = $1 AND role = 'dm'
     LIMIT 1`,
    [user.id]
  );
  if (!result.rows.length) deny(403, "DM access required");
  req.dmMembership = result.rows[0];
  return { user, membership: result.rows[0] };
}

/**
 * Gate a campaign-scoped DM API: when auth required, user must be DM of that campaign.
 * When auth not required (local), no-op.
 */
async function requireDmIfAuthRequired(req, campaignId) {
  if (!auth.isAuthRequired()) return null;
  return requireDm(req, campaignId);
}

/**
 * Gate a global DM API: when auth required, user must be DM of any campaign.
 */
async function requireAnyDmIfAuthRequired(req) {
  if (!auth.isAuthRequired()) return null;
  return requireAnyDm(req);
}

async function userControlsCharacter(userId, characterId) {
  const result = await db.query(
    `SELECT 1 FROM character_controllers
     WHERE user_id = $1 AND character_id = $2
     LIMIT 1`,
    [userId, characterId]
  );
  return result.rows.length > 0;
}

async function characterInCampaign(campaignId, characterId) {
  const result = await db.query(
    `SELECT 1 FROM campaign_characters
     WHERE campaign_id = $1 AND character_id = $2
     LIMIT 1`,
    [campaignId, characterId]
  );
  return result.rows.length > 0;
}

async function requireCharacterControl(req, campaignId, characterId) {
  const { user, membership } = await requireCampaignMember(req, campaignId);
  const inCampaign = await characterInCampaign(campaignId, characterId);
  if (!inCampaign) deny(404, "Character not found in campaign");
  if (membership.role === "dm") {
    return { user, membership, asDm: true };
  }
  const controls = await userControlsCharacter(user.id, characterId);
  if (!controls) deny(403, "You do not control this character");
  return { user, membership, asDm: false };
}

async function userIsDmForCharacter(userId, characterId) {
  const result = await db.query(
    `SELECT 1 FROM campaign_memberships cm
     JOIN campaign_characters cc ON cc.campaign_id = cm.campaign_id
     WHERE cm.user_id = $1 AND cm.role = 'dm' AND cc.character_id = $2
     LIMIT 1`,
    [userId, characterId]
  );
  return result.rows.length > 0;
}

/** Character-level gate: controller or DM of a participating campaign. */
async function requireCharacterControlDirect(req, characterId) {
  const user = await requireUser(req);
  if (await userControlsCharacter(user.id, characterId)) {
    return { user, asDm: false };
  }
  if (await userIsDmForCharacter(user.id, characterId)) {
    return { user, asDm: true };
  }
  deny(403, "You do not control this character");
}

module.exports = {
  assertMutationSafety,
  isAllowedMutationContentType,
  requireUser,
  requireUserIfAuthRequired,
  getMembership,
  requireCampaignMember,
  requireDm,
  requireAnyDm,
  requireDmIfAuthRequired,
  requireAnyDmIfAuthRequired,
  userControlsCharacter,
  characterInCampaign,
  userIsDmForCharacter,
  requireCharacterControl,
  requireCharacterControlDirect,
  deny
};
