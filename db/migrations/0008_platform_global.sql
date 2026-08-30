-- Global platform events and message board (not campaign-scoped).

CREATE TABLE IF NOT EXISTS platform_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  created_by_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_events_status_chk CHECK (status IN ('scheduled', 'cancelled', 'completed'))
);

CREATE INDEX IF NOT EXISTS platform_events_starts_idx ON platform_events (starts_at);
CREATE INDEX IF NOT EXISTS platform_events_creator_idx ON platform_events (created_by_user_id);

CREATE TABLE IF NOT EXISTS platform_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_post_id uuid REFERENCES platform_posts (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_posts_created_idx ON platform_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_posts_parent_idx ON platform_posts (parent_post_id);
