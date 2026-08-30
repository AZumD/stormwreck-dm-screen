/**
 * Calendar date + time helpers for scheduling (no D&D / in-world clock).
 */
"use strict";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parseCalendarDate(value, label = "date") {
  const s = String(value ?? "").trim();
  if (!DATE_RE.test(s)) {
    const err = new Error(`Invalid ${label} (expected YYYY-MM-DD)`);
    err.status = 400;
    throw err;
  }
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
  return s;
}

function parseOptionalTime(value, label = "time") {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!TIME_RE.test(s)) {
    const err = new Error(`Invalid ${label} (expected HH:MM)`);
    err.status = 400;
    throw err;
  }
  const [, hh, mm] = s.match(TIME_RE);
  return `${hh.padStart(2, "0")}:${mm}`;
}

function parseIsoTimestamp(value, label = "timestamp") {
  if (value == null || value === "") {
    const err = new Error(`${label} is required`);
    err.status = 400;
    throw err;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
  return d.toISOString();
}

function parseOptionalIsoTimestamp(value, label = "timestamp") {
  if (value == null || value === "") return null;
  return parseIsoTimestamp(value, label);
}

function assertUuid(value, label = "id") {
  const s = String(value ?? "").trim();
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(s)) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
  return s;
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatTimeLabel(timeStr) {
  if (!timeStr) return null;
  const [hh, mm] = String(timeStr).split(":");
  return `${hh}:${mm}`;
}

module.exports = {
  DATE_RE,
  parseCalendarDate,
  parseOptionalTime,
  parseIsoTimestamp,
  parseOptionalIsoTimestamp,
  assertUuid,
  addDays,
  formatTimeLabel
};
