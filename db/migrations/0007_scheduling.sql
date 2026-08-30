-- Platform scheduling: global user availability, campaign events, RSVPs, message board.

CREATE TABLE IF NOT EXISTS user_availability (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available',
  available_from time,
  available_until time,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date),
  CONSTRAINT user_availability_status_chk CHECK (status IN ('available', 'maybe', 'unavailable'))
);

CREATE INDEX IF NOT EXISTS user_availability_user_date_idx ON user_availability (user_id, date);

CREATE TABLE IF NOT EXISTS campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  created_by_user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_events_status_chk CHECK (status IN ('scheduled', 'cancelled', 'completed'))
);

CREATE INDEX IF NOT EXISTS campaign_events_campaign_starts_idx ON campaign_events (campaign_id, starts_at);

CREATE TABLE IF NOT EXISTS campaign_event_rsvps (
  event_id uuid NOT NULL REFERENCES campaign_events (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT campaign_event_rsvps_status_chk CHECK (status IN ('going', 'maybe', 'cant'))
);

CREATE INDEX IF NOT EXISTS campaign_event_rsvps_event_idx ON campaign_event_rsvps (event_id);

CREATE TABLE IF NOT EXISTS campaign_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_post_id uuid REFERENCES campaign_posts (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_posts_campaign_created_idx ON campaign_posts (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_posts_campaign_pinned_idx ON campaign_posts (campaign_id, pinned DESC, created_at DESC);
