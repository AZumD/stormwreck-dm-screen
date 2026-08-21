/**
 * Import item catalogue JSON files into Postgres `items` table.
 * Usage: node db/seed-items.mjs
 * Requires DATABASE_URL and applied migrations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const itemDir = path.join(root, "data", "catalogues", "item");

function mapItem(raw) {
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : [];
  const known = new Set([
    "id",
    "name",
    "itemType",
    "rarity",
    "value",
    "weight",
    "attunement",
    "description",
    "properties",
    "notes",
    "category",
    "tags",
    "portrait",
    "updatedAt"
  ]);
  const extras = {};
  Object.entries(raw || {}).forEach(([k, v]) => {
    if (!known.has(k)) extras[k] = v;
  });
  return {
    id,
    name: String(raw.name || id).trim() || id,
    item_type: raw.itemType != null ? String(raw.itemType) : null,
    rarity: raw.rarity != null ? String(raw.rarity) : null,
    value: raw.value != null ? String(raw.value) : null,
    weight: raw.weight != null ? String(raw.weight) : null,
    attunement: Boolean(raw.attunement),
    description: raw.description != null ? String(raw.description) : "",
    properties: raw.properties != null ? String(raw.properties) : "",
    notes: raw.notes != null ? String(raw.notes) : "",
    category: raw.category != null ? String(raw.category) : null,
    tags: JSON.stringify(tags),
    portrait_url: raw.portrait ? String(raw.portrait) : null,
    extras: JSON.stringify(extras)
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!fs.existsSync(itemDir)) {
    console.error("Missing item catalogue folder:", itemDir);
    process.exit(1);
  }

  const files = fs.readdirSync(itemDir).filter((f) => f.endsWith(".json"));
  const rows = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(itemDir, file), "utf8"));
      const mapped = mapItem(raw);
      if (mapped) rows.push(mapped);
    } catch (err) {
      console.warn("skip", file, err.message);
    }
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  let upserted = 0;
  for (const row of rows) {
    await client.query(
      `INSERT INTO items (
        id, name, item_type, rarity, value, weight, attunement,
        description, properties, notes, category, tags, portrait_url, extras, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14::jsonb, now()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        item_type = EXCLUDED.item_type,
        rarity = EXCLUDED.rarity,
        value = EXCLUDED.value,
        weight = EXCLUDED.weight,
        attunement = EXCLUDED.attunement,
        description = EXCLUDED.description,
        properties = EXCLUDED.properties,
        notes = EXCLUDED.notes,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        portrait_url = EXCLUDED.portrait_url,
        extras = EXCLUDED.extras,
        updated_at = now()`,
      [
        row.id,
        row.name,
        row.item_type,
        row.rarity,
        row.value,
        row.weight,
        row.attunement,
        row.description,
        row.properties,
        row.notes,
        row.category,
        row.tags,
        row.portrait_url,
        row.extras
      ]
    );
    upserted += 1;
  }

  await client.end();
  console.log(`Upserted ${upserted} items from ${files.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
