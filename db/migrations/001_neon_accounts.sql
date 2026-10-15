CREATE TABLE app_users (
  uid text PRIMARY KEY CHECK (uid ~ '^[A-Za-z0-9_-]{1,128}$'),
  clerk_user_id text UNIQUE,
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 254),
  name text NOT NULL DEFAULT '' CHECK (length(name) <= 120),
  credits integer NOT NULL DEFAULT 5 CHECK (credits >= 0),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  is_pro boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  user_id text NOT NULL REFERENCES app_users(uid),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  transcript_text text NOT NULL DEFAULT '' CHECK (length(transcript_text) <= 150000),
  words jsonb NOT NULL CHECK (jsonb_typeof(words) = 'array' AND jsonb_array_length(words) <= 12000),
  style_settings jsonb NOT NULL CHECK (jsonb_typeof(style_settings) = 'object'),
  has_deducted_credit boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_updated ON projects(user_id, updated_at DESC, id DESC);

CREATE TABLE billing_events (
  event_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES app_users(uid),
  credits integer NOT NULL CHECK (credits > 0),
  plan text CHECK (plan IN ('pro', 'team')),
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE request_limits (
  key_hash text PRIMARY KEY,
  count integer NOT NULL CHECK (count > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX request_limits_expiry ON request_limits(expires_at);

-- No browser database access. Only the application's server role uses these tables.
REVOKE ALL ON app_users, projects, billing_events, request_limits FROM PUBLIC;
