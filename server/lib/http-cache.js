/**
 * Lightweight HTTP file streaming + conditional caching (ETag / Last-Modified / 304).
 * ETags use size + mtime — no full-file hashing.
 */
"use strict";

const fs = require("fs");
const fsp = require("fs/promises");

function weakEtagFromStat(stat) {
  const size = Number(stat.size) || 0;
  const mtime = Math.floor(Number(stat.mtimeMs) || 0);
  return `W/"${size.toString(16)}-${mtime.toString(16)}"`;
}

function parseIfNoneMatch(header) {
  if (!header) return [];
  return String(header)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function notModified(req, etag, mtime) {
  const inm = parseIfNoneMatch(req.headers["if-none-match"]);
  if (inm.length && (inm.includes("*") || inm.includes(etag))) return true;

  const ims = req.headers["if-modified-since"];
  if (ims) {
    const since = Date.parse(ims);
    if (!Number.isNaN(since)) {
      /* HTTP dates are second-resolution */
      const fileSec = Math.floor(new Date(mtime).getTime() / 1000);
      const sinceSec = Math.floor(since / 1000);
      if (fileSec <= sinceSec) return true;
    }
  }
  return false;
}

function cacheControlForStatic(filePath) {
  const lower = String(filePath || "").toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "public, max-age=0, must-revalidate";
  }
  /* Unfingerprinted JS/CSS must revalidate on every deploy (Railway CDN + browser). */
  if (lower.endsWith(".js") || lower.endsWith(".css") || lower.endsWith(".map") || lower.endsWith(".json")) {
    return "public, max-age=0, must-revalidate";
  }
  /* Repo static images/fonts — longer TTL; ETag still allows 304. */
  return "public, max-age=86400";
}

/**
 * Cache-Control for catalogue `/api/assets/...` responses.
 * Versioned `?v=` URLs are immutable; legacy URLs stay short-lived + revalidatable.
 */
function cacheControlForAssetUrl(reqUrl) {
  try {
    const u = new URL(reqUrl || "/", "http://local");
    const v = u.searchParams.get("v");
    if (v != null && String(v).trim() !== "") {
      return "public, max-age=31536000, immutable";
    }
  } catch {
    /* ignore */
  }
  return "public, max-age=60, must-revalidate";
}

/**
 * Stream a file to the response with Content-Length, ETag, Last-Modified, Cache-Control.
 * Returns a Promise that settles when the stream finishes or errors (after headers).
 */
function sendFileStream(req, res, filePath, options = {}) {
  const contentType = options.contentType || "application/octet-stream";
  const cacheControl = options.cacheControl || "public, max-age=60";

  return fsp.stat(filePath).then((stat) => {
    if (!stat.isFile()) {
      const err = new Error("Not a file");
      err.status = 404;
      throw err;
    }
    const etag = weakEtagFromStat(stat);
    const lastModified = stat.mtime.toUTCString();

    if (notModified(req, etag, stat.mtime)) {
      res.writeHead(304, {
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": cacheControl
      });
      res.end();
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      ETag: etag,
      "Last-Modified": lastModified,
      "Cache-Control": cacheControl,
      "Accept-Ranges": "bytes"
    });

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      let settled = false;
      function fail(err) {
        if (settled) return;
        settled = true;
        stream.destroy();
        if (!res.headersSent) {
          reject(err);
          return;
        }
        res.destroy();
        resolve();
      }
      function ok() {
        if (settled) return;
        settled = true;
        resolve();
      }
      stream.on("error", fail);
      res.on("error", fail);
      res.on("close", () => {
        if (!settled) stream.destroy();
      });
      stream.on("end", ok);
      stream.pipe(res);
    });
  });
}

module.exports = {
  weakEtagFromStat,
  notModified,
  cacheControlForStatic,
  cacheControlForAssetUrl,
  sendFileStream
};
