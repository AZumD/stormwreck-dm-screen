-- Phase 6: platform seams — game systems, campaign participation, generic character state
-- Apply with: npm run db:migrate  (requires DATABASE_URL)

CREATE TABLE IF NOT EXISTS game_systems (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO game_systems (id, name, description)
VALUES ('dnd5e', 'Dungeons & Dragons 5e', 'D&D 5th Edition tabletop rules')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS game_system_id text REFERENCES game_systems (id);
UPDATE campaigns SET game_system_id = 'dnd5e' WHERE game_system_id IS NULL;

ALTER TABLE characters ADD COLUMN IF NOT EXISTS game_system_id text REFERENCES game_systems (id);
UPDATE characters SET game_system_id = 'dnd5e' WHERE game_system_id IS NULL;

CREATE TABLE IF NOT EXISTS campaign_characters (
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  character_id text NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, character_id)
);

CREATE INDEX IF NOT EXISTS campaign_characters_character_id_idx ON campaign_characters (character_id);

INSERT INTO campaign_characters (campaign_id, character_id, status, created_at)
SELECT c.campaign_id, c.id, 'active', c.created_at
FROM characters c
WHERE c.campaign_id IS NOT NULL
ON CONFLICT (campaign_id, character_id) DO NOTHING;

ALTER TABLE character_state ADD COLUMN IF NOT EXISTS system_state jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE character_state cs
SET system_state = jsonb_build_object(
  'hp', jsonb_build_object(
    'current', cs.hp_current,
    'max', cs.hp_max,
    'temp', COALESCE(cs.hp_temp, 0)
  ),
  'conditions', COALESCE(cs.conditions, '[]'::jsonb),
  'deathSaves', COALESCE(cs.death_saves, '{}'::jsonb),
  'spellSlots', COALESCE(cs.spell_slots, '{}'::jsonb),
  'classResources', COALESCE(cs.class_resources, '{}'::jsonb),
  'inspiration', COALESCE(cs.inspiration, false)
)
WHERE cs.system_state = '{}'::jsonb
  AND (
    cs.hp_current IS NOT NULL
    OR cs.hp_max IS NOT NULL
    OR cs.hp_temp IS DISTINCT FROM 0
    OR cs.conditions IS DISTINCT FROM '[]'::jsonb
    OR cs.death_saves IS DISTINCT FROM '{}'::jsonb
    OR cs.spell_slots IS DISTINCT FROM '{}'::jsonb
    OR cs.class_resources IS DISTINCT FROM '{}'::jsonb
    OR cs.inspiration IS TRUE
  );

UPDATE character_state cs
SET system_state = jsonb_build_object(
  'hp', jsonb_build_object('current', cs.hp_current, 'max', cs.hp_max, 'temp', COALESCE(cs.hp_temp, 0)),
  'conditions', COALESCE(cs.conditions, '[]'::jsonb),
  'deathSaves', COALESCE(cs.death_saves, '{}'::jsonb),
  'spellSlots', COALESCE(cs.spell_slots, '{}'::jsonb),
  'classResources', COALESCE(cs.class_resources, '{}'::jsonb),
  'inspiration', COALESCE(cs.inspiration, false)
)
WHERE cs.system_state = '{}'::jsonb;

UPDATE characters c
SET sheet = c.sheet || jsonb_build_object('level', c.level)
WHERE c.level IS NOT NULL
  AND NOT (c.sheet ? 'level');

DO $$ BEGIN
  ALTER TABLE campaigns ALTER COLUMN game_system_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE characters ALTER COLUMN game_system_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
