/**
 * Resolve bind host and validate production startup requirements (Phase 4B).
 */
"use strict";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Local default: loopback. Production default: all interfaces (Railway).
 * Explicit HOST always wins.
 */
function resolveHost() {
  if (process.env.HOST != null && String(process.env.HOST).trim() !== "") {
    return String(process.env.HOST).trim();
  }
  return isProduction() ? "0.0.0.0" : "127.0.0.1";
}

/**
 * Fail closed in production: DATABASE_URL, SESSION_SECRET, DM_DATA_ROOT.
 * Local development is unchanged (DM_DATA_ROOT optional).
 * @returns {{ host: string, dataRootRequired: boolean }}
 */
function validateStartupConfig() {
  const auth = require("./auth");
  auth.requireAuthConfig();

  if (isProduction()) {
    if (!process.env.DM_DATA_ROOT || String(process.env.DM_DATA_ROOT).trim() === "") {
      throw new Error(
        "PRODUCTION: DM_DATA_ROOT must be set to a persistent volume path (e.g. /data). Refusing to write campaign data to the ephemeral filesystem."
      );
    }
  }

  return {
    host: resolveHost(),
    dataRootRequired: isProduction()
  };
}

module.exports = {
  isProduction,
  resolveHost,
  validateStartupConfig
};
