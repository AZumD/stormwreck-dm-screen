/**
 * Local DM Library server — static frontend + /api file-backed persistence.
 * Zero npm dependencies (Node built-ins only). Binds to 127.0.0.1 by default.
 */
"use strict";

const http = require("http");
const fsp = require("fs/promises");
const path = require("path");
const { URL } = require("url");
const { ensureDataLayout, projectRoot } = require("./lib/atomic-fs");
const { createApiRoutes, handleApi } = require("./routes/api");
const { sendJson } = require("./lib/http-util");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const cleaned = decoded.replace(/^\/+/, "");
  const abs = path.resolve(root, cleaned);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return abs;
}

async function sendFile(res, filePath) {
  const data = await fsp.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": data.length
  });
  res.end(data);
}

async function serveStatic(req, res, root, pathname) {
  let target = safeJoin(root, pathname === "/" ? "/index.html" : pathname);
  if (!target) {
    sendJson(res, 400, { ok: false, error: "Invalid path" });
    return;
  }
  try {
    let stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      target = path.join(target, "index.html");
      stat = await fsp.stat(target);
    }
    if (!stat.isFile()) {
      sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }
    await sendFile(res, target);
  } catch {
    /* try .html extension */
    try {
      const htmlPath = `${target}.html`;
      await fsp.access(htmlPath);
      await sendFile(res, htmlPath);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  }
}

async function main() {
  await ensureDataLayout();
  const root = projectRoot();
  const apiRoutes = createApiRoutes();

  const server = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host || `${HOST}:${PORT}`;
      const url = new URL(req.url || "/", `http://${host}`);
      const pathname = url.pathname;

      if (pathname.startsWith("/api")) {
        const handled = await handleApi(req, res, pathname, apiRoutes);
        if (!handled) sendJson(res, 404, { ok: false, error: "Not found" });
        return;
      }

      await serveStatic(req, res, root, pathname);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) sendJson(res, 500, { ok: false, error: err.message || "Server error" });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`DM Library listening on http://${HOST}:${PORT}`);
    console.log(`Data directory: ${path.join(root, "data")}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
