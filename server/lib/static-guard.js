/**
 * Deny HTTP static access to private / non-frontend paths.
 * Assets under /data remain available only via /api/assets/...
 */
"use strict";

const BLOCKED_TOP = new Set([
  "data",
  "server",
  "source",
  "node_modules",
  ".git",
  ".cursor",
  ".vscode",
  ".idea",
  ".github"
]);

/**
 * @param {string} pathname URL pathname (e.g. "/data/campaigns/index.json")
 * @returns {boolean} true if static serving must refuse
 */
function isDeniedStaticPath(pathname) {
  const raw = String(pathname || "");
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return true;
  }
  const normalized = decoded.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length) return false;

  for (const part of parts) {
    if (part === "." || part === "..") return true;
    if (part.startsWith(".")) return true;
  }

  const top = parts[0].toLowerCase();
  if (BLOCKED_TOP.has(top)) return true;
  if (top.startsWith(".env")) return true;
  if (top === "env" && parts[0] === "env") return false;
  /* bare .env files at root already caught by startsWith(".") */

  return false;
}

module.exports = {
  isDeniedStaticPath,
  BLOCKED_TOP
};
