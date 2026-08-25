/**
 * Local DM Library server — static frontend + /api file-backed persistence.
 * Optional Postgres when DATABASE_URL is set (Phase 1–4B). Local bind defaults to 127.0.0.1;
 * production defaults to 0.0.0.0 and requires DM_DATA_ROOT on a persistent volume.
 */
"use strict";

try {
  require("dotenv").config();
} catch {
  /* dotenv optional until npm install */
}

const http = require("http");
const fsp = require("fs/promises");
const path = require("path");
const { URL } = require("url");
const { ensureDataLayout, projectRoot, dataRoot } = require("./lib/atomic-fs");
const { createApiRoutes, handleApi } = require("./routes/api");
const { sendJson } = require("./lib/http-util");
const { isDeniedStaticPath } = require("./lib/static-guard");
const { validateStartupConfig } = require("./lib/startup-config");
const { registerShutdownHandlers } = require("./lib/shutdown");
const { sendFileStream, cacheControlForStatic } = require("./lib/http-cache");
const db = require("./lib/db");

const PORT = Number(process.env.PORT) || 3000;

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

async function sendFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  await sendFileStream(req, res, filePath, {
    contentType: MIME[ext] || "application/octet-stream",
    cacheControl: cacheControlForStatic(filePath)
  });
}

function denyStatic(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

async function serveStatic(req, res, root, pathname) {
  if (isDeniedStaticPath(pathname)) {
    denyStatic(res);
    return;
  }

  /* Browsers often request /favicon.ico; serve root favicon.png when no .ico exists. */
  let requestPath = pathname;
  if (pathname === "/favicon.ico") {
    try {
      await fsp.access(path.join(root, "favicon.png"));
      requestPath = "/favicon.png";
    } catch {
      /* fall through to normal 404 */
    }
  }

  let target = safeJoin(root, requestPath === "/" ? "/index.html" : requestPath);
  if (!target) {
    sendJson(res, 400, { ok: false, error: "Invalid path" });
    return;
  }

  /* Double-check resolved path stays outside denied top-level dirs */
  const rel = path.relative(root, target).replace(/\\/g, "/");
  if (isDeniedStaticPath(`/${rel}`)) {
    denyStatic(res);
    return;
  }

  try {
    let stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      target = path.join(target, "index.html");
      const dirRel = path.relative(root, target).replace(/\\/g, "/");
      if (isDeniedStaticPath(`/${dirRel}`)) {
        denyStatic(res);
        return;
      }
      stat = await fsp.stat(target);
    }
    if (!stat.isFile()) {
      denyStatic(res);
      return;
    }
    await sendFile(req, res, target);
  } catch {
    try {
      const htmlPath = `${target}.html`;
      const htmlRel = path.relative(root, htmlPath).replace(/\\/g, "/");
      if (isDeniedStaticPath(`/${htmlRel}`)) {
        denyStatic(res);
        return;
      }
      await fsp.access(htmlPath);
      await sendFile(req, res, htmlPath);
    } catch {
      denyStatic(res);
    }
  }
}

async function main() {
  let startup;
  try {
    startup = validateStartupConfig();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }

  const HOST = startup.host;
  await ensureDataLayout();
  const root = projectRoot();
  const resolvedDataRoot = dataRoot();
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

  registerShutdownHandlers(server, {
    closeDb: () => db.close(),
    exit: true
  });

  server.listen(PORT, HOST, () => {
    console.log(`DM Library listening on http://${HOST}:${PORT}`);
    console.log(`Data directory: ${resolvedDataRoot}`);
  });
}

module.exports = { serveStatic, isDeniedStaticPath, sendFile };

if (require.main === module) {
  main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
