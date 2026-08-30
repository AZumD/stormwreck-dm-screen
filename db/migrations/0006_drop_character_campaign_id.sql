-- Drop legacy characters.campaign_id; participation lives in campaign_characters only.

INSERT INTO campaign_characters (campaign_id, character_id, status, created_at)
SELECT c.campaign_id, c.id, 'active', COALESCE(c.created_at, now())
FROM characters c
WHERE c.campaign_id IS NOT NULL
ON CONFLICT (campaign_id, character_id) DO NOTHING;

DROP INDEX IF EXISTS characters_campaign_id_idx;
ALTER TABLE characters DROP COLUMN IF EXISTS campaign_id;
