/**
 * Lightweight Postgres schema probes for health checks and friendly drift errors.
 */
"use strict";

const MIGRATE_HINT = "Database schema is outdated. Run: npm run db:migrate";

async function probeSchema(db) {
  const schema = {
    sessionsTable: false,
    gameSystemIdColumn: false,
    campaignCharactersTable: false,
    schedulingTables: false,
    platformTables: false,
    complete: false
  };

  try {
    const sessions = await db.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'sessions'`
    );
    schema.sessionsTable = Number(sessions.rows[0]?.n || 0) > 0;

    const gameSystem = await db.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'game_system_id'`
    );
    schema.gameSystemIdColumn = Number(gameSystem.rows[0]?.n || 0) > 0;

    const participation = await db.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'campaign_characters'`
    );
    schema.campaignCharactersTable = Number(participation.rows[0]?.n || 0) > 0;

    const scheduling = await db.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('user_availability', 'campaign_events', 'campaign_posts')`
    );
    schema.schedulingTables = Number(scheduling.rows[0]?.n || 0) === 3;

    const platform = await db.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('platform_events', 'platform_posts')`
    );
    schema.platformTables = Number(platform.rows[0]?.n || 0) === 2;
  } catch {
    return schema;
  }

  schema.complete =
    schema.sessionsTable &&
    schema.gameSystemIdColumn &&
    schema.campaignCharactersTable &&
    schema.schedulingTables &&
    schema.platformTables;
  return schema;
}

function schemaDriftMessage(err) {
  const msg = String(err?.message || "");
  if (!msg) return null;
  if (/column .* does not exist/i.test(msg)) return MIGRATE_HINT;
  if (/relation .* does not exist/i.test(msg)) return MIGRATE_HINT;
  return null;
}

module.exports = { probeSchema, schemaDriftMessage, MIGRATE_HINT };
