/**
 * Phase 5D: campaign_revealed_npcs — DM reveals catalogue NPCs to players.
 */
"use strict";

const db = require("./db");
const catalogues = require("./catalogues");
const authorize = require("./authorize");
const auth = require("./auth");
const { assertSafeId } = require("./ids");

function requireDb() {
  if (!db.isDbConfigured()) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
}

function deny(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

async function listRevealed(campaignId) {
  requireDb();
  const safeCampaign = assertSafeId(campaignId, "campaign id");
  const result = await db.query(
    `SELECT campaign_id, npc_id, revealed_by, revealed_at, note
     FROM campaign_revealed_npcs
     WHERE campaign_id = $1
     ORDER BY revealed_at ASC, npc_id ASC`,
    [safeCampaign]
  );
  return result.rows;
}

async function getRevealRow(campaignId, npcId) {
  requireDb();
  const safeCampaign = assertSafeId(campaignId, "campaign id");
  const safeNpc = assertSafeId(npcId, "npc id");
  const result = await db.query(
    `SELECT campaign_id, npc_id, revealed_by, revealed_at, note
     FROM campaign_revealed_npcs
     WHERE campaign_id = $1 AND npc_id = $2
     LIMIT 1`,
    [safeCampaign, safeNpc]
  );
  return result.rows[0] || null;
}

async function isRevealed(campaignId, npcId) {
  return Boolean(await getRevealRow(campaignId, npcId));
}

function toRevealedNpcDto(entry, revealRow) {
  const id = entry.id || revealRow.npc_id;
  return {
    id,
    name: entry.name || entry.title || id,
    role: entry.role || entry.title || null,
    summary: entry.summary || entry.trait || "",
    description: entry.description || entry.text || entry.notes || "",
    portraitUrl: entry.portrait || entry.portraitUrl || entry.image || null,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    revealedAt: revealRow.revealed_at || null,
    note: revealRow.note || ""
  };
}

async function hydrateRevealed(revealRow) {
  const entry = await catalogues.get("npc", revealRow.npc_id);
  if (!entry) {
    return {
      id: revealRow.npc_id,
      name: revealRow.npc_id,
      role: null,
      summary: "",
      description: "",
      portraitUrl: null,
      tags: [],
      revealedAt: revealRow.revealed_at || null,
      note: revealRow.note || "",
      missingCatalogue: true
    };
  }
  return toRevealedNpcDto(entry, revealRow);
}

async function listForDm(req, campaignId) {
  requireDb();
  await authorize.requireDmIfAuthRequired(req, campaignId);
  const rows = await listRevealed(campaignId);
  const npcs = [];
  for (const row of rows) {
    npcs.push(await hydrateRevealed(row));
  }
  return npcs;
}

async function listForPlayer(req, campaignId) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const rows = await listRevealed(campaignId);
  const npcs = [];
  for (const row of rows) {
    npcs.push(await hydrateRevealed(row));
  }
  return npcs;
}

async function getForPlayer(req, campaignId, npcId) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const row = await getRevealRow(campaignId, npcId);
  if (!row) deny(404, "NPC not revealed");
  return hydrateRevealed(row);
}

async function reveal(req, campaignId, npcId, { note } = {}) {
  requireDb();
  await authorize.requireDmIfAuthRequired(req, campaignId);
  authorize.assertMutationSafety(req);

  const safeCampaign = assertSafeId(campaignId, "campaign id");
  const safeNpc = assertSafeId(npcId, "npc id");
  const entry = await catalogues.get("npc", safeNpc);
  if (!entry) deny(404, "NPC catalogue entry not found");

  let revealedBy = null;
  const sessionUser = await auth.resolveSessionUser(req);
  if (sessionUser?.id) revealedBy = sessionUser.id;

  const noteText = note != null ? String(note).slice(0, 500) : "";
  const result = await db.query(
    `INSERT INTO campaign_revealed_npcs (campaign_id, npc_id, revealed_by, note)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (campaign_id, npc_id) DO UPDATE
       SET note = EXCLUDED.note,
           revealed_by = COALESCE(EXCLUDED.revealed_by, campaign_revealed_npcs.revealed_by)
     RETURNING campaign_id, npc_id, revealed_by, revealed_at, note`,
    [safeCampaign, safeNpc, revealedBy, noteText]
  );
  return hydrateRevealed(result.rows[0]);
}

async function unreveal(req, campaignId, npcId) {
  requireDb();
  await authorize.requireDmIfAuthRequired(req, campaignId);
  authorize.assertMutationSafety(req);

  const safeCampaign = assertSafeId(campaignId, "campaign id");
  const safeNpc = assertSafeId(npcId, "npc id");
  const result = await db.query(
    `DELETE FROM campaign_revealed_npcs
     WHERE campaign_id = $1 AND npc_id = $2
     RETURNING npc_id`,
    [safeCampaign, safeNpc]
  );
  if (!result.rows.length) deny(404, "NPC was not revealed");
  return { ok: true, npcId: safeNpc };
}

module.exports = {
  listRevealed,
  getRevealRow,
  isRevealed,
  listForDm,
  listForPlayer,
  getForPlayer,
  reveal,
  unreveal,
  toRevealedNpcDto
};
