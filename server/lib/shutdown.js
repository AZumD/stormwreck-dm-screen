/**
 * Graceful HTTP + Postgres shutdown for Railway SIGTERM/SIGINT (Phase 4B).
 */
"use strict";

/**
 * Register once-only SIGTERM/SIGINT handlers.
 * @param {import("http").Server} server
 * @param {{ closeDb?: () => Promise<void>, exit?: boolean, onSignal?: (signal: string) => void }} [opts]
 * @returns {{ shutdown: (signal?: string) => Promise<void>, isShuttingDown: () => boolean, unregister: () => void }}
 */
function registerShutdownHandlers(server, opts = {}) {
  const closeDb = opts.closeDb || (async () => {});
  const shouldExit = opts.exit !== false;
  let shuttingDown = false;

  async function shutdown(signal = "SIGTERM") {
    if (shuttingDown) return;
    shuttingDown = true;
    if (typeof opts.onSignal === "function") opts.onSignal(signal);
    console.log(`Received ${signal}; shutting down gracefully…`);

    await new Promise((resolve) => {
      server.close((err) => {
        if (err) console.error("HTTP server close error:", err.message || err);
        resolve();
      });
    });

    try {
      await closeDb();
    } catch (err) {
      console.error("Database pool close error:", err.message || err);
    }

    if (shouldExit) {
      process.exit(0);
    }
  }

  const onTerm = () => {
    void shutdown("SIGTERM");
  };
  const onInt = () => {
    void shutdown("SIGINT");
  };

  process.on("SIGTERM", onTerm);
  process.on("SIGINT", onInt);

  return {
    shutdown,
    isShuttingDown: () => shuttingDown,
    unregister() {
      process.off("SIGTERM", onTerm);
      process.off("SIGINT", onInt);
    }
  };
}

module.exports = { registerShutdownHandlers };
