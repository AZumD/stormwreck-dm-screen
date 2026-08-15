/**
 * Minimal HTTP helpers (no Express dependency).
 */
"use strict";

function readBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("Body too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const buf = await readBody(req);
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
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendError(res, err) {
  sendJson(res, err.status || 500, { ok: false, error: err.message || "Server error" });
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
  readBody,
  readJsonBody,
  sendJson,
  sendError,
  matchRoute
};
