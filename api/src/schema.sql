CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  api_key     TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS heartbeats (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts          TIMESTAMPTZ NOT NULL,
  language    TEXT NOT NULL,
  project     TEXT NOT NULL,
  file        TEXT NOT NULL,
  is_write    BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS heartbeats_user_ts_idx ON heartbeats(user_id, ts DESC);

CREATE TABLE IF NOT EXISTS daily_summaries (
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day            DATE   NOT NULL,
  total_seconds  INTEGER NOT NULL DEFAULT 0,
  by_language    JSONB  NOT NULL DEFAULT '{}'::jsonb,
  by_project     JSONB  NOT NULL DEFAULT '{}'::jsonb,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

INSERT INTO users (username, api_key)
VALUES ('jericho', 'dev-key-jericho-change-me')
ON CONFLICT (username) DO NOTHING;
