/**
 * Campaign message board — plain-text async posts, no chat/realtime.
 */
"use strict";

const db = require("./db");
const authorize = require("./authorize");
const { assertUuid } = require("./datetime");

const MAX_BODY = 4000;

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

function toPostDto(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    authorUserId: row.author_user_id,
    authorName: row.author_name || "Unknown",
    parentPostId: row.parent_post_id || null,
    body: row.body || "",
    pinned: Boolean(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replyCount: row.reply_count != null ? Number(row.reply_count) : undefined
  };
}

async function assertPostInCampaign(campaignId, postId) {
  const safeId = assertUuid(postId, "post id");
  const result = await db.query(
    `SELECT id, campaign_id, author_user_id, parent_post_id, body, pinned, created_at, updated_at
     FROM campaign_posts WHERE id = $1 AND campaign_id = $2`,
    [safeId, campaignId]
  );
  if (!result.rows.length) deny(404, "Post not found");
  return result.rows[0];
}

async function listCampaignPosts(req, campaignId) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const result = await db.query(
    `SELECT p.id, p.campaign_id, p.author_user_id, p.parent_post_id, p.body, p.pinned,
            p.created_at, p.updated_at, u.name AS author_name,
            (SELECT COUNT(*)::int FROM campaign_posts r WHERE r.parent_post_id = p.id) AS reply_count
     FROM campaign_posts p
     JOIN users u ON u.id = p.author_user_id
     WHERE p.campaign_id = $1 AND p.parent_post_id IS NULL
     ORDER BY p.pinned DESC, p.created_at DESC`,
    [campaignId]
  );
  return result.rows.map(toPostDto);
}

async function listPostReplies(req, campaignId, postId) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const parent = await assertPostInCampaign(campaignId, postId);
  if (parent.parent_post_id) deny(400, "Replies cannot have nested threads in MVP");
  const result = await db.query(
    `SELECT p.id, p.campaign_id, p.author_user_id, p.parent_post_id, p.body, p.pinned,
            p.created_at, p.updated_at, u.name AS author_name
     FROM campaign_posts p
     JOIN users u ON u.id = p.author_user_id
     WHERE p.parent_post_id = $1
     ORDER BY p.created_at ASC`,
    [parent.id]
  );
  return result.rows.map(toPostDto);
}

async function createCampaignPost(req, campaignId, body) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  const text = String(body?.body || "").trim();
  if (!text) deny(400, "body is required");
  if (text.length > MAX_BODY) deny(400, "body too long");
  let parentPostId = null;
  if (body?.parentPostId) {
    parentPostId = assertUuid(body.parentPostId, "parent post id");
    const parent = await assertPostInCampaign(campaignId, parentPostId);
    if (parent.parent_post_id) deny(400, "Nested replies not supported");
  }
  const result = await db.query(
    `INSERT INTO campaign_posts (campaign_id, author_user_id, parent_post_id, body, updated_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING id, campaign_id, author_user_id, parent_post_id, body, pinned, created_at, updated_at`,
    [campaignId, user.id, parentPostId, text]
  );
  const row = result.rows[0];
  const withName = await db.query(`SELECT name FROM users WHERE id = $1`, [user.id]);
  return toPostDto({ ...row, author_name: withName.rows[0]?.name || user.name });
}

async function updateCampaignPost(req, campaignId, postId, body) {
  requireDb();
  const { user, membership } = await authorize.requireCampaignMember(req, campaignId);
  const existing = await assertPostInCampaign(campaignId, postId);
  const isAuthor = existing.author_user_id === user.id;
  const isDm = membership.role === "dm";
  if (!isAuthor && !isDm) deny(403, "Forbidden");
  const text = body?.body != null ? String(body.body).trim() : existing.body;
  if (!text) deny(400, "body is required");
  if (text.length > MAX_BODY) deny(400, "body too long");
  const result = await db.query(
    `UPDATE campaign_posts SET body = $3, updated_at = now()
     WHERE id = $1 AND campaign_id = $2
     RETURNING id, campaign_id, author_user_id, parent_post_id, body, pinned, created_at, updated_at`,
    [existing.id, campaignId, text]
  );
  const withName = await db.query(`SELECT name FROM users WHERE id = $1`, [
    result.rows[0].author_user_id
  ]);
  return toPostDto({ ...result.rows[0], author_name: withName.rows[0]?.name });
}

async function deleteCampaignPost(req, campaignId, postId) {
  requireDb();
  const { user, membership } = await authorize.requireCampaignMember(req, campaignId);
  const existing = await assertPostInCampaign(campaignId, postId);
  const isAuthor = existing.author_user_id === user.id;
  const isDm = membership.role === "dm";
  if (!isAuthor && !isDm) deny(403, "Forbidden");
  await db.query(`DELETE FROM campaign_posts WHERE id = $1 AND campaign_id = $2`, [
    existing.id,
    campaignId
  ]);
  return { postId: existing.id, campaignId };
}

async function setPostPinned(req, campaignId, postId, pinned) {
  requireDb();
  await authorize.requireDm(req, campaignId);
  const existing = await assertPostInCampaign(campaignId, postId);
  if (existing.parent_post_id) deny(400, "Only top-level posts can be pinned");
  const result = await db.query(
    `UPDATE campaign_posts SET pinned = $3, updated_at = now()
     WHERE id = $1 AND campaign_id = $2
     RETURNING id, campaign_id, author_user_id, parent_post_id, body, pinned, created_at, updated_at`,
    [existing.id, campaignId, Boolean(pinned)]
  );
  const withName = await db.query(`SELECT name FROM users WHERE id = $1`, [
    result.rows[0].author_user_id
  ]);
  return toPostDto({ ...result.rows[0], author_name: withName.rows[0]?.name });
}

module.exports = {
  listCampaignPosts,
  listPostReplies,
  createCampaignPost,
  updateCampaignPost,
  deleteCampaignPost,
  setPostPinned
};
