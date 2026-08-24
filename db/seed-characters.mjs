/**
 * Import campaign PC catalogue entries into Postgres characters.
 * Usage: node db/seed-characters.mjs [campaignId]
 * Requires DATABASE_URL, migrations, and item seed (for inventory resolution).
 *
 * WARNING — ONE-SHOT / MANUAL ONLY:
 * Re-running this reconciles from catalogue + campaign-state and UPSERTS
 * character_state (HP, conditions, resources). That can overwrite live play
 * mutations. Never put `db:seed:characters` in `npm start`, Railway start
 * commands, or automatic deploy hooks. Run once for initial import, then
 * manage HP/conditions via the app / character state API.
 */
import dotenv from "dotenv";
import { createRequire } from "node:module";

dotenv.config();

const require = createRequire(import.meta.url);
const characters = require("../server/lib/characters.js");

async function main() {
  const campaignId = process.argv[2] || "stormwreck-isle";
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  console.warn(
    "WARNING: db:seed:characters upserts character_state and can overwrite live HP/conditions. One-shot only."
  );
  const result = await characters.importCampaignPartyPcs(campaignId);
  console.log(
    `Imported ${result.imported.length} character(s) for campaign ${campaignId}:`,
    result.imported.map((r) => `${r.id} (${r.resolvedItems}/${r.inventoryCount} items resolved)`).join(", ")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
