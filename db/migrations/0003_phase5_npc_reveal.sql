-- Phase 5D: DM-controlled NPC reveals for the player companion.
-- campaign_id is text (slug), matching campaigns.id. npc_id is a catalogue npc id.

CREATE TABLE IF NOT EXISTS campaign_revealed_npcs (
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  npc_id text NOT NULL,
  revealed_by uuid REFERENCES users (id) ON DELETE SET NULL,
  revealed_at timestamptz NOT NULL DEFAULT now(),
  note text NOT NULL DEFAULT '',
  PRIMARY KEY (campaign_id, npc_id)
);

CREATE INDEX IF NOT EXISTS campaign_revealed_npcs_campaign_idx
  ON campaign_revealed_npcs (campaign_id);
