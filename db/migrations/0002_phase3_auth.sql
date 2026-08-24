-- Phase 3A: credentials + server-side sessions + case-insensitive email uniqueness
-- Apply with: npm run db:migrate  (requires DATABASE_URL)

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

-- Normalize existing emails (trim + lower) before unique index
UPDATE users
SET email = lower(btrim(email))
WHERE email IS NOT NULL AND email <> lower(btrim(email));

DROP INDEX IF EXISTS users_email_uq;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(btrim(email))) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uq ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
