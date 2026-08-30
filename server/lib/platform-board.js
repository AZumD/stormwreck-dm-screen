/**
 * Global platform message board — plain-text async posts, no campaign coupling.
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
    authorUserId: row.author_user_id,
    authorName: row.author_name || "Unknown",
    parentPostId: row.parent_post_id || null,
    body: row.body || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replyCount: row.reply_count != null ? Number(row.reply_count) : undefined
  };
}

async function assertPost(postId) {
  const safeId = assertUuid(postId, "post id");
  const result = await db.query(
    `SELECT id, author_user_id, parent_post_id, body, created_at, updated_at
     FROM platform_posts WHERE id = $1`,
    [safeId]
  );
  if (!result.rows.length) deny(404, "Post not found");
  return result.rows[0];
}

async function listPlatformPosts(req) {
  requireDb();
  await authorize.requireUser(req);
  const result = await db.query(
    `SELECT p.id, p.author_user_id, p.parent_post_id, p.body, p.created_at, p.updated_at,
            u.name AS author_name,
            (SELECT COUNT(*)::int FROM platform_posts r WHERE r.parent_post_id = p.id) AS reply_count
     FROM platform_posts p
     JOIN users u ON u.id = p.author_user_id
     WHERE p.parent_post_id IS NULL
     ORDER BY p.created_at DESC
     LIMIT 100`
  );
  return result.rows.map(toPostDto);
}

async function listPlatformPostReplies(req, postId) {
  requireDb();
  await authorize.requireUser(req);
  const parent = await assertPost(postId);
  if (parent.parent_post_id) deny(400, "Replies cannot have nested threads in MVP");
  const result = await db.query(
    `SELECT p.id, p.author_user_id, p.parent_post_id, p.body, p.created_at, p.updated_at,
            u.name AS author_name
     FROM platform_posts p
     JOIN users u ON u.id = p.author_user_id
     WHERE p.parent_post_id = $1
     ORDER BY p.created_at ASC`,
    [parent.id]
  );
  return result.rows.map(toPostDto);
}

async function createPlatformPost(req, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const text = String(body?.body || "").trim();
  if (!text) deny(400, "body is required");
  if (text.length > MAX_BODY) deny(400, "body too long");
  let parentPostId = null;
  if (body?.parentPostId) {
    parentPostId = assertUuid(body.parentPostId, "parent post id");
    const parent = await assertPost(parentPostId);
    if (parent.parent_post_id) deny(400, "Nested replies not supported");
  }
  const result = await db.query(
    `INSERT INTO platform_posts (author_user_id, parent_post_id, body, updated_at)
     VALUES ($1, $2, $3, now())
     RETURNING id, author_user_id, parent_post_id, body, created_at, updated_at`,
    [user.id, parentPostId, text]
  );
  return toPostDto({ ...result.rows[0], author_name: user.name });
}

async function updatePlatformPost(req, postId, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const existing = await assertPost(postId);
  if (existing.author_user_id !== user.id) deny(403, "Only the author can edit this post");
  const text = body?.body != null ? String(body.body).trim() : existing.body;
  if (!text) deny(400, "body is required");
  if (text.length > MAX_BODY) deny(400, "body too long");
  const result = await db.query(
    `UPDATE platform_posts SET body = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, author_user_id, parent_post_id, body, created_at, updated_at`,
    [existing.id, text]
  );
  const withName = await db.query(`SELECT name FROM users WHERE id = $1`, [user.id]);
  return toPostDto({ ...result.rows[0], author_name: withName.rows[0]?.name || user.name });
}

async function deletePlatformPost(req, postId) {
  requireDb();
  const user = await authorize.requireUser(req);
  const existing = await assertPost(postId);
  if (existing.author_user_id !== user.id) deny(403, "Only the author can delete this post");
  await db.query(`DELETE FROM platform_posts WHERE id = $1`, [existing.id]);
  return { postId: existing.id };
}

module.exports = {
  listPlatformPosts,
  listPlatformPostReplies,
  createPlatformPost,
  updatePlatformPost,
  deletePlatformPost
};
