/**
 * Minimal HTTP helpers (no Express dependency).
 */
"use strict";

const DEFAULT_BODY_LIMIT = 25 * 1024 * 1024;
/** UVTT embeds a full map image as base64 — real files often exceed 25MB. */
const UVTT_BODY_LIMIT = 64 * 1024 * 1024;

function readBody(req, limit = DEFAULT_BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;

    function fail(err) {
      if (settled) return;
      settled = true;
      reject(err);
    }

    function ok(value) {
      if (settled) return;
      settled = true;
      resolve(value);
    }

    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        /* Drain the rest so the connection can still send a JSON 413. */
        req.resume();
        fail(
          Object.assign(
            new Error(
              `Body too large (max ${Math.floor(limit / (1024 * 1024))}MB). UVTT maps with embedded images can be large — try a smaller export or raise the server limit.`
            ),
            { status: 413 }
          )
        );
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      ok(Buffer.concat(chunks));
    });
    req.on("error", fail);
  });
}

async function readJsonBody(req, options = {}) {
  const opts = typeof options === "number" ? { limit: options } : options;
  const limit =
    opts.limit != null
      ? Number(opts.limit)
      : opts.maxBytes != null
        ? Number(opts.maxBytes)
        : DEFAULT_BODY_LIMIT;
  const buf = await readBody(req, limit);
  if (!buf.length) return undefined;
  try {
    return JSON.parse(buf.toString("utf8"));
  } catch {
    const err = new Error("Invalid JSON body");
    err.status = 400;
    throw err;
  }
}

function sendJson(res, status, data) {
  if (res.headersSent || res.writableEnded) return;
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendError(res, err) {
  let message = err.message || "Server error";
  try {
    const { schemaDriftMessage } = require("./schema-probe");
    const drift = schemaDriftMessage(err);
    if (drift) message = drift;
  } catch {
    /* schema-probe optional at load time */
  }
  sendJson(res, err.status || 500, { ok: false, error: message });
}

function matchRoute(method, pathname, routes) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = pathname.match(route.pattern);
    if (m) {
      const params = {};
      (route.keys || []).forEach((key, i) => {
        params[key] = decodeURIComponent(m[i + 1]);
      });
      return { handler: route.handler, params };
    }
  }
  return null;
}

module.exports = {
  DEFAULT_BODY_LIMIT,
  UVTT_BODY_LIMIT,
  readBody,
  readJsonBody,
  sendJson,
  sendError,
  matchRoute
};
