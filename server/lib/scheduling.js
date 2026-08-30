/**
 * Platform scheduling: global user availability, campaign events, RSVPs.
 * No dependency on characters, game systems, or D&D.
 */
"use strict";

const db = require("./db");
const authorize = require("./authorize");
const {
  parseCalendarDate,
  parseOptionalTime,
  parseIsoTimestamp,
  parseOptionalIsoTimestamp,
  assertUuid
} = require("./datetime");

const AVAILABILITY_STATUSES = Object.freeze(["available", "maybe", "unavailable"]);
const EVENT_STATUSES = Object.freeze(["scheduled", "cancelled", "completed"]);
const RSVP_STATUSES = Object.freeze(["going", "maybe", "cant"]);

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

function toAvailabilityDto(row) {
  if (!row) return null;
  return {
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
    status: row.status,
    availableFrom: row.available_from ? String(row.available_from).slice(0, 5) : null,
    availableUntil: row.available_until ? String(row.available_until).slice(0, 5) : null,
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toEventDto(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    title: row.title || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at || null,
    location: row.location || "",
    notes: row.notes || "",
    status: row.status,
    createdByUserId: row.created_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRsvpDto(row) {
  return {
    userId: row.user_id,
    userName: row.user_name || null,
    status: row.status,
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rsvpLabel(status) {
  if (status === "going") return "Going";
  if (status === "maybe") return "Maybe";
  if (status === "cant") return "Can't make it";
  return status;
}

async function listUserAvailability(req, from, to) {
  requireDb();
  const user = await authorize.requireUser(req);
  const fromDate = parseCalendarDate(from, "from");
  const toDate = parseCalendarDate(to, "to");
  const result = await db.query(
    `SELECT user_id, date, status, available_from, available_until, note, created_at, updated_at
     FROM user_availability
     WHERE user_id = $1 AND date >= $2::date AND date <= $3::date
     ORDER BY date ASC`,
    [user.id, fromDate, toDate]
  );
  return result.rows.map(toAvailabilityDto);
}

async function upsertUserAvailability(req, dateStr, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const date = parseCalendarDate(dateStr, "date");
  const status = String(body?.status || "").trim();
  if (!AVAILABILITY_STATUSES.includes(status)) {
    deny(400, "status must be available, maybe, or unavailable");
  }
  const availableFrom = parseOptionalTime(body?.availableFrom, "availableFrom");
  const availableUntil = parseOptionalTime(body?.availableUntil, "availableUntil");
  const note = body?.note != null ? String(body.note).slice(0, 500) : "";
  const result = await db.query(
    `INSERT INTO user_availability (user_id, date, status, available_from, available_until, note, updated_at)
     VALUES ($1, $2::date, $3, $4::time, $5::time, $6, now())
     ON CONFLICT (user_id, date) DO UPDATE SET
       status = EXCLUDED.status,
       available_from = EXCLUDED.available_from,
       available_until = EXCLUDED.available_until,
       note = EXCLUDED.note,
       updated_at = now()
     RETURNING user_id, date, status, available_from, available_until, note, created_at, updated_at`,
    [user.id, date, status, availableFrom, availableUntil, note]
  );
  return toAvailabilityDto(result.rows[0]);
}

async function deleteUserAvailability(req, dateStr) {
  requireDb();
  const user = await authorize.requireUser(req);
  const date = parseCalendarDate(dateStr, "date");
  await db.query(`DELETE FROM user_availability WHERE user_id = $1 AND date = $2::date`, [
    user.id,
    date
  ]);
  return { date };
}

async function assertEventInCampaign(campaignId, eventId) {
  const safeEvent = assertUuid(eventId, "event id");
  const result = await db.query(
    `SELECT id, campaign_id, title, starts_at, ends_at, location, notes, status,
            created_by_user_id, created_at, updated_at
     FROM campaign_events
     WHERE id = $1 AND campaign_id = $2`,
    [safeEvent, campaignId]
  );
  if (!result.rows.length) deny(404, "Event not found");
  return result.rows[0];
}

async function listCampaignEvents(req, campaignId, opts = {}) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const from = opts.from ? parseCalendarDate(opts.from, "from") : null;
  const to = opts.to ? parseCalendarDate(opts.to, "to") : null;
  const params = [campaignId];
  let sql = `SELECT id, campaign_id, title, starts_at, ends_at, location, notes, status,
                    created_by_user_id, created_at, updated_at
             FROM campaign_events
             WHERE campaign_id = $1`;
  if (from) {
    params.push(from);
    sql += ` AND starts_at >= $${params.length}::date`;
  }
  if (to) {
    params.push(to);
    sql += ` AND starts_at < ($${params.length}::date + interval '1 day')`;
  }
  sql += ` ORDER BY starts_at ASC`;
  const result = await db.query(sql, params);
  return result.rows.map(toEventDto);
}

async function getCampaignEventDetail(req, campaignId, eventId) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  const eventRow = await assertEventInCampaign(campaignId, eventId);
  const members = await db.query(
    `SELECT u.id, u.name, cm.role
     FROM campaign_memberships cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.campaign_id = $1
     ORDER BY u.name ASC`,
    [campaignId]
  );
  const rsvps = await db.query(
    `SELECT r.user_id, r.status, r.note, r.created_at, r.updated_at, u.name AS user_name
     FROM campaign_event_rsvps r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_id = $1`,
    [eventRow.id]
  );
  const rsvpByUser = new Map(rsvps.rows.map((r) => [r.user_id, r]));
  const memberRsvps = members.rows.map((m) => {
    const r = rsvpByUser.get(m.id);
    return {
      userId: m.id,
      userName: m.name,
      role: m.role,
      status: r?.status || null,
      note: r?.note || "",
      label: r ? rsvpLabel(r.status) : "No response"
    };
  });
  const counts = { going: 0, maybe: 0, cant: 0, noResponse: 0 };
  memberRsvps.forEach((m) => {
    if (m.status === "going") counts.going += 1;
    else if (m.status === "maybe") counts.maybe += 1;
    else if (m.status === "cant") counts.cant += 1;
    else counts.noResponse += 1;
  });
  const myRsvp = rsvpByUser.get(user.id);
  return {
    event: toEventDto(eventRow),
    rsvps: memberRsvps,
    counts,
    myRsvp: myRsvp
      ? { status: myRsvp.status, note: myRsvp.note || "", label: rsvpLabel(myRsvp.status) }
      : null
  };
}

async function createCampaignEvent(req, campaignId, body) {
  requireDb();
  const { user } = await authorize.requireDm(req, campaignId);
  const title = String(body?.title || "").trim().slice(0, 200) || "Session";
  const startsAt = parseIsoTimestamp(body?.startsAt, "startsAt");
  const endsAt = parseOptionalIsoTimestamp(body?.endsAt, "endsAt");
  const location = body?.location != null ? String(body.location).slice(0, 200) : "";
  const notes = body?.notes != null ? String(body.notes).slice(0, 2000) : "";
  const result = await db.query(
    `INSERT INTO campaign_events (
      campaign_id, title, starts_at, ends_at, location, notes, status, created_by_user_id, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, now())
    RETURNING id, campaign_id, title, starts_at, ends_at, location, notes, status,
              created_by_user_id, created_at, updated_at`,
    [campaignId, title, startsAt, endsAt, location, notes, user.id]
  );
  return toEventDto(result.rows[0]);
}

async function updateCampaignEvent(req, campaignId, eventId, body) {
  requireDb();
  await authorize.requireDm(req, campaignId);
  const existing = await assertEventInCampaign(campaignId, eventId);
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
    `UPDATE campaign_events
     SET title = $3, starts_at = $4, ends_at = $5, location = $6, notes = $7, status = $8, updated_at = now()
     WHERE id = $1 AND campaign_id = $2
     RETURNING id, campaign_id, title, starts_at, ends_at, location, notes, status,
               created_by_user_id, created_at, updated_at`,
    [existing.id, campaignId, title, startsAt, endsAt, location, notes, status]
  );
  return toEventDto(result.rows[0]);
}

async function deleteCampaignEvent(req, campaignId, eventId) {
  requireDb();
  await authorize.requireDm(req, campaignId);
  await assertEventInCampaign(campaignId, eventId);
  await db.query(`DELETE FROM campaign_events WHERE id = $1 AND campaign_id = $2`, [
    assertUuid(eventId, "event id"),
    campaignId
  ]);
  return { eventId, campaignId };
}

async function putEventRsvp(req, campaignId, eventId, body) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  await assertEventInCampaign(campaignId, eventId);
  const status = String(body?.status || "").trim();
  if (!RSVP_STATUSES.includes(status)) {
    deny(400, "status must be going, maybe, or cant");
  }
  const note = body?.note != null ? String(body.note).slice(0, 500) : "";
  const safeEvent = assertUuid(eventId, "event id");
  const result = await db.query(
    `INSERT INTO campaign_event_rsvps (event_id, user_id, status, note, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (event_id, user_id) DO UPDATE SET
       status = EXCLUDED.status,
       note = EXCLUDED.note,
       updated_at = now()
     RETURNING event_id, user_id, status, note, created_at, updated_at`,
    [safeEvent, user.id, status, note]
  );
  const row = result.rows[0];
  return {
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    note: row.note,
    label: rsvpLabel(row.status)
  };
}

async function deleteEventRsvp(req, campaignId, eventId) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  await assertEventInCampaign(campaignId, eventId);
  await db.query(`DELETE FROM campaign_event_rsvps WHERE event_id = $1 AND user_id = $2`, [
    assertUuid(eventId, "event id"),
    user.id
  ]);
  return { eventId, userId: user.id };
}

function memberAvailabilityLine(row) {
  const status = row.availability_status;
  if (!status) {
    return { status: null, label: "No response", availableFrom: null, availableUntil: null, note: "" };
  }
  const label =
    status === "available" ? "Available" : status === "maybe" ? "Maybe" : "Unavailable";
  return {
    status,
    label,
    availableFrom: row.available_from ? String(row.available_from).slice(0, 5) : null,
    availableUntil: row.available_until ? String(row.available_until).slice(0, 5) : null,
    note: row.note || ""
  };
}

async function getCampaignAvailabilityDay(req, campaignId, dateStr) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const date = parseCalendarDate(dateStr, "date");
  const result = await db.query(
    `SELECT u.id AS user_id, u.name AS user_name, cm.role,
            ua.status AS availability_status, ua.available_from, ua.available_until, ua.note
     FROM campaign_memberships cm
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN user_availability ua ON ua.user_id = u.id AND ua.date = $2::date
     WHERE cm.campaign_id = $1
     ORDER BY u.name ASC`,
    [campaignId, date]
  );
  const members = result.rows.map((r) => ({
    userId: r.user_id,
    userName: r.user_name,
    role: r.role,
    ...memberAvailabilityLine(r)
  }));
  const counts = { responded: 0, available: 0, maybe: 0, unavailable: 0, noResponse: 0 };
  members.forEach((m) => {
    if (!m.status) counts.noResponse += 1;
    else {
      counts.responded += 1;
      if (m.status === "available") counts.available += 1;
      else if (m.status === "maybe") counts.maybe += 1;
      else counts.unavailable += 1;
    }
  });
  return { date, members, counts, total: members.length };
}

async function listCampaignAvailabilityRange(req, campaignId, from, to) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const fromDate = parseCalendarDate(from, "from");
  const toDate = parseCalendarDate(to, "to");
  const membersResult = await db.query(
    `SELECT COUNT(*)::int AS n FROM campaign_memberships WHERE campaign_id = $1`,
    [campaignId]
  );
  const totalMembers = membersResult.rows[0]?.n || 0;
  const avail = await db.query(
    `SELECT ua.date,
            COUNT(*) FILTER (WHERE ua.status = 'available')::int AS available,
            COUNT(*) FILTER (WHERE ua.status = 'maybe')::int AS maybe,
            COUNT(*) FILTER (WHERE ua.status = 'unavailable')::int AS unavailable,
            COUNT(*)::int AS responded
     FROM campaign_memberships cm
     JOIN user_availability ua ON ua.user_id = cm.user_id
     WHERE cm.campaign_id = $1 AND ua.date >= $2::date AND ua.date <= $3::date
     GROUP BY ua.date
     ORDER BY ua.date ASC`,
    [campaignId, fromDate, toDate]
  );
  const days = avail.rows.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
    available: r.available,
    maybe: r.maybe,
    unavailable: r.unavailable,
    responded: r.responded,
    totalMembers,
    noResponse: Math.max(0, totalMembers - r.responded)
  }));
  return { from: fromDate, to: toDate, totalMembers, days };
}

async function listUpcomingEventsForUser(req, opts = {}) {
  requireDb();
  const user = await authorize.requireUser(req);
  const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), 50);
  const after = opts.after ? parseIsoTimestamp(opts.after, "after") : new Date().toISOString();
  const result = await db.query(
    `SELECT e.id, e.campaign_id, e.title, e.starts_at, e.ends_at, e.location, e.notes, e.status,
            e.created_by_user_id, e.created_at, e.updated_at,
            c.name AS campaign_name,
            r.status AS my_rsvp_status
     FROM campaign_events e
     JOIN campaign_memberships cm ON cm.campaign_id = e.campaign_id AND cm.user_id = $1
     JOIN campaigns c ON c.id = e.campaign_id
     LEFT JOIN campaign_event_rsvps r ON r.event_id = e.id AND r.user_id = $1
     WHERE e.status = 'scheduled' AND e.starts_at >= $2
     ORDER BY e.starts_at ASC
     LIMIT $3`,
    [user.id, after, limit]
  );
  return result.rows.map((row) => ({
    ...toEventDto(row),
    campaignName: row.campaign_name,
    myRsvpStatus: row.my_rsvp_status || null,
    myRsvpLabel: row.my_rsvp_status ? rsvpLabel(row.my_rsvp_status) : "No RSVP"
  }));
}

module.exports = {
  AVAILABILITY_STATUSES,
  EVENT_STATUSES,
  RSVP_STATUSES,
  listUserAvailability,
  upsertUserAvailability,
  deleteUserAvailability,
  listCampaignEvents,
  getCampaignEventDetail,
  createCampaignEvent,
  updateCampaignEvent,
  deleteCampaignEvent,
  putEventRsvp,
  deleteEventRsvp,
  getCampaignAvailabilityDay,
  listCampaignAvailabilityRange,
  listUpcomingEventsForUser,
  rsvpLabel
};
