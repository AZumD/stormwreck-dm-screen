/**
 * Idempotent auth bootstrap for local/dev: DM + player users, memberships, controllers.
 * Usage: node db/bootstrap-auth.mjs
 *
 * Reads passwords and emails from env only — never commit secrets.
 */
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function requireEnv(name) {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") {
    throw new Error(`${name} is required`);
  }
  return String(v);
}

async function upsertUser(client, { name, email, password }) {
  const normalized = normalizeEmail(email);
  const hash = await bcrypt.hash(password, 10);
  const existing = await client.query(
    `SELECT id FROM users WHERE email IS NOT NULL AND lower(btrim(email)) = $1 LIMIT 1`,
    [normalized]
  );
  if (existing.rows[0]) {
    await client.query(
      `UPDATE users
       SET name = $2, email = $3, password_hash = $4, updated_at = now()
       WHERE id = $1`,
      [existing.rows[0].id, name, normalized, hash]
    );
    return existing.rows[0].id;
  }
  const inserted = await client.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, normalized, hash]
  );
  return inserted.rows[0].id;
}

async function upsertMembership(client, campaignId, userId, role) {
  await client.query(
    `INSERT INTO campaign_memberships (campaign_id, user_id, role)
     VALUES ($1, $2, $3::membership_role)
     ON CONFLICT (campaign_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [campaignId, userId, role]
  );
}

async function upsertController(client, characterId, userId) {
  await client.query(
    `INSERT INTO character_controllers (character_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (character_id, user_id) DO NOTHING`,
    [characterId, userId]
  );
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const campaignId = process.env.BOOTSTRAP_CAMPAIGN_ID || "stormwreck-isle";
  const dmEmail = requireEnv("BOOTSTRAP_DM_EMAIL");
  const dmPassword = requireEnv("BOOTSTRAP_DM_PASSWORD");
  const dmName = process.env.BOOTSTRAP_DM_NAME || "DM";
  const playerEmail = requireEnv("BOOTSTRAP_PLAYER_EMAIL");
  const playerPassword = requireEnv("BOOTSTRAP_PLAYER_PASSWORD");
  const playerName = process.env.BOOTSTRAP_PLAYER_NAME || "Player";
  const characterIds = String(process.env.BOOTSTRAP_CHARACTER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO campaigns (id, name, description, game_system_id) VALUES ($1, $2, $3, 'dnd5e')
       ON CONFLICT (id) DO NOTHING`,
      [campaignId, campaignId, ""]
    );

    const dmId = await upsertUser(client, {
      name: dmName,
      email: dmEmail,
      password: dmPassword
    });
    const playerId = await upsertUser(client, {
      name: playerName,
      email: playerEmail,
      password: playerPassword
    });

    await upsertMembership(client, campaignId, dmId, "dm");
    await upsertMembership(client, campaignId, playerId, "player");

    for (const characterId of characterIds) {
      const exists = await client.query(
        "SELECT 1 FROM campaign_characters WHERE character_id = $1 AND campaign_id = $2",
        [characterId, campaignId]
      );
      if (!exists.rows.length) {
        console.warn(`skip controller: character ${characterId} not in campaign ${campaignId}`);
        continue;
      }
      await upsertController(client, characterId, playerId);
    }

    await client.query("COMMIT");
    console.log("Bootstrap complete:");
    console.log(`  campaign: ${campaignId}`);
    console.log(`  dm user id: ${dmId} (${normalizeEmail(dmEmail)})`);
    console.log(`  player user id: ${playerId} (${normalizeEmail(playerEmail)})`);
    console.log(`  controllers: ${characterIds.join(", ") || "(none)"}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
