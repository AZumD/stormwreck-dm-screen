-- Phase 1 foundation: users, campaigns, characters, items, inventory, notes
-- Apply with: npm run db:migrate  (requires DATABASE_URL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM ('dm', 'player');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE character_type AS ENUM ('player', 'sidekick', 'npc');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  auth_subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_subject_uq ON users (auth_subject) WHERE auth_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS campaigns (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'player',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS characters (
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  name text NOT NULL,
  type character_type NOT NULL DEFAULT 'player',
  level integer NOT NULL DEFAULT 1,
  portrait_url text,
  sheet jsonb NOT NULL DEFAULT '{}'::jsonb,
  catalogue_pc_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS characters_campaign_id_idx ON characters (campaign_id);

CREATE TABLE IF NOT EXISTS character_controllers (
  character_id text NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, user_id)
);

CREATE TABLE IF NOT EXISTS character_state (
  character_id text PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
  hp_current integer,
  hp_max integer,
  hp_temp integer NOT NULL DEFAULT 0,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  death_saves jsonb NOT NULL DEFAULT '{}'::jsonb,
  spell_slots jsonb NOT NULL DEFAULT '{}'::jsonb,
  class_resources jsonb NOT NULL DEFAULT '{}'::jsonb,
  inspiration boolean NOT NULL DEFAULT false,
  extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  name text NOT NULL,
  item_type text,
  rarity text,
  value text,
  weight text,
  attunement boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  properties text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  category text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  portrait_url text,
  extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_category_idx ON items (category);
CREATE INDEX IF NOT EXISTS items_name_idx ON items (name);

CREATE TABLE IF NOT EXISTS inventory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id text NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  item_id text REFERENCES items (id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  equipped boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  custom_name text,
  custom_item jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_entries_character_id_idx ON inventory_entries (character_id);
CREATE INDEX IF NOT EXISTS inventory_entries_item_id_idx ON inventory_entries (item_id);

CREATE TABLE IF NOT EXISTS player_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  character_id text REFERENCES characters (id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_notes_user_campaign_idx ON player_notes (user_id, campaign_id);
CREATE INDEX IF NOT EXISTS player_notes_updated_at_idx ON player_notes (updated_at DESC);

-- Seed built-in campaign row (safe if re-run)
INSERT INTO campaigns (id, name, description)
VALUES (
  'stormwreck-isle',
  'Dragons of Stormwreck Isle Remix',
  'Remixed Swedish Stormwreck Isle campaign'
)
ON CONFLICT (id) DO NOTHING;
