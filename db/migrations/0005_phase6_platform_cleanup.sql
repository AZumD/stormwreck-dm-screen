-- Phase 6 cleanup: drop legacy D&D columns after system_state migration
-- Apply with: npm run db:migrate  (requires DATABASE_URL)

ALTER TABLE characters ALTER COLUMN campaign_id DROP NOT NULL;

ALTER TABLE character_state DROP COLUMN IF EXISTS hp_current;
ALTER TABLE character_state DROP COLUMN IF EXISTS hp_max;
ALTER TABLE character_state DROP COLUMN IF EXISTS hp_temp;
ALTER TABLE character_state DROP COLUMN IF EXISTS conditions;
ALTER TABLE character_state DROP COLUMN IF EXISTS death_saves;
ALTER TABLE character_state DROP COLUMN IF EXISTS spell_slots;
ALTER TABLE character_state DROP COLUMN IF EXISTS class_resources;
ALTER TABLE character_state DROP COLUMN IF EXISTS inspiration;

ALTER TABLE characters DROP COLUMN IF EXISTS level;
