/**
 * Import campaign PC catalogue entries into Postgres characters.
 * Usage: node db/seed-characters.mjs [campaignId]
 * Requires DATABASE_URL, migrations, and item seed (for inventory resolution).
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
