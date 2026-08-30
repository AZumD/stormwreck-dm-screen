/**
 * Global platform events — not campaign-scoped; any authenticated user may create.
 */
"use strict";

const db = require("./db");
const authorize = require("./authorize");
const {
  assertUuid,
  parseIsoTimestamp,
  parseOptionalIsoTimestamp,
  parseCalendarDate
} = require("./datetime");

const EVENT_STATUSES = ["scheduled", "cancelled", "completed"];

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

function toEventDto(row) {
  return {
    id: row.id,
    kind: "platform",
    title: row.title || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at || null,
    location: row.location || "",
    notes: row.notes || "",
    status: row.status || "scheduled",
    createdByUserId: row.created_by_user_id || null,
    createdByName: row.created_by_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scopeLabel: "GLOBAL"
  };
}

async function assertEvent(eventId) {
  const safeId = assertUuid(eventId, "event id");
  const result = await db.query(
    `SELECT e.id, e.title, e.starts_at, e.ends_at, e.location, e.notes, e.status,
            e.created_by_user_id, e.created_at, e.updated_at, u.name AS created_by_name
     FROM platform_events e
     LEFT JOIN users u ON u.id = e.created_by_user_id
     WHERE e.id = $1`,
    [safeId]
  );
  if (!result.rows.length) deny(404, "Event not found");
  return result.rows[0];
}

async function listPlatformEvents(req, opts = {}) {
  requireDb();
  await authorize.requireUser(req);
  const params = [];
  const clauses = ["e.status = 'scheduled'"];
  if (opts.from) {
    const from = parseCalendarDate(opts.from, "from");
    params.push(from);
    clauses.push(`e.starts_at::date >= $${params.length}::date`);
  }
  if (opts.to) {
    const to = parseCalendarDate(opts.to, "to");
    params.push(to);
    clauses.push(`e.starts_at::date <= $${params.length}::date`);
  }
  if (opts.after) {
    const after = parseIsoTimestamp(opts.after, "after");
    params.push(after);
    clauses.push(`e.starts_at >= $${params.length}`);
  }
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  params.push(limit);
  const result = await db.query(
    `SELECT e.id, e.title, e.starts_at, e.ends_at, e.location, e.notes, e.status,
            e.created_by_user_id, e.created_at, e.updated_at, u.name AS created_by_name
     FROM platform_events e
     LEFT JOIN users u ON u.id = e.created_by_user_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY e.starts_at ASC
     LIMIT $${params.length}`,
    params
  );
  return result.rows.map(toEventDto);
}

async function getPlatformEvent(req, eventId) {
  requireDb();
  await authorize.requireUser(req);
  return toEventDto(await assertEvent(eventId));
}

async function createPlatformEvent(req, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const title = String(body?.title || "").trim().slice(0, 200) || "Event";
  const startsAt = parseIsoTimestamp(body?.startsAt, "startsAt");
  const endsAt = parseOptionalIsoTimestamp(body?.endsAt, "endsAt");
  const location = body?.location != null ? String(body.location).slice(0, 200) : "";
  const notes = body?.notes != null ? String(body.notes).slice(0, 2000) : "";
  const result = await db.query(
    `INSERT INTO platform_events (
      title, starts_at, ends_at, location, notes, status, created_by_user_id, updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, now())
    RETURNING id, title, starts_at, ends_at, location, notes, status,
              created_by_user_id, created_at, updated_at`,
    [title, startsAt, endsAt, location, notes, user.id]
  );
  return toEventDto({ ...result.rows[0], created_by_name: user.name });
}

async function updatePlatformEvent(req, eventId, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const existing = await assertEvent(eventId);
  if (existing.created_by_user_id !== user.id) deny(403, "Only the creator can edit this event");
  const title = body?.title != null ? String(body.title).trim().slice(0, 200) : existing.title;
  const startsAt =
    body?.startsAt != null ? parseIsoTimestamp(body.startsAt, "startsAt") : existing.starts_at;
  const endsAt =
    body?.endsAt !== undefined
      ? body.endsAt
        ? parseIsoTimestamp(body.endsAt, "endsAt")
        : null
      : existing.ends_at;
  const location = body?.location != null ? String(body.location).slice(0, 200) : existing.location;
  const notes = body?.notes != null ? String(body.notes).slice(0, 2000) : existing.notes;
  let status = existing.status;
  if (body?.status != null) {
    const next = String(body.status).trim();
    if (!EVENT_STATUSES.includes(next)) deny(400, "Invalid event status");
    status = next;
  }
  const result = await db.query(
    `UPDATE platform_events
     SET title = $2, starts_at = $3, ends_at = $4, location = $5, notes = $6, status = $7, updated_at = now()
     WHERE id = $1
     RETURNING id, title, starts_at, ends_at, location, notes, status,
               created_by_user_id, created_at, updated_at`,
    [existing.id, title, startsAt, endsAt, location, notes, status]
  );
  return toEventDto({ ...result.rows[0], created_by_name: existing.created_by_name || user.name });
}

async function deletePlatformEvent(req, eventId) {
  requireDb();
  const user = await authorize.requireUser(req);
  const existing = await assertEvent(eventId);
  if (existing.created_by_user_id !== user.id) deny(403, "Only the creator can delete this event");
  await db.query(`DELETE FROM platform_events WHERE id = $1`, [existing.id]);
  return { eventId: existing.id };
}

module.exports = {
  EVENT_STATUSES,
  listPlatformEvents,
  getPlatformEvent,
  createPlatformEvent,
  updatePlatformEvent,
  deletePlatformEvent
};
