-- Buffalo Jumpstart schema. Safe to run on every start (idempotent).

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  agent_code      TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  mobile          TEXT,
  upline_code     TEXT,
  password_hash   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending | active | rejected | inactive
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  trainee         BOOLEAN NOT NULL DEFAULT TRUE,     -- enrolled in Buffalo Jumpstart
  self_registered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at     TIMESTAMPTZ,
  approved_by     INTEGER REFERENCES users(id),
  rejected_reason TEXT,
  last_activity_at TIMESTAMPTZ,
  last_idle_reminder_at TIMESTAMPTZ,
  deactivated_at  TIMESTAMPTZ,
  course_completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS users_upline_idx ON users (upper(upline_code));
CREATE UNIQUE INDEX IF NOT EXISTS users_code_upper_idx ON users (upper(agent_code));

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS videos (
  id          SERIAL PRIMARY KEY,
  position    INTEGER NOT NULL,
  kind        TEXT NOT NULL,                 -- welcome | module | congrats
  title       TEXT NOT NULL,
  youtube_id  TEXT,
  quiz_status TEXT NOT NULL DEFAULT 'none',  -- none | draft | approved (modules only)
  quiz_approved_by INTEGER REFERENCES users(id),
  quiz_approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS questions (
  id        SERIAL PRIMARY KEY,
  video_id  INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 0,
  qtype     TEXT NOT NULL,                   -- mc | tf
  text      TEXT NOT NULL,
  options   JSONB NOT NULL,                  -- array of strings
  correct   INTEGER NOT NULL                 -- index into options
);

CREATE TABLE IF NOT EXISTS video_completions (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id     INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id   INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  passed     BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts (user_id, video_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS upline_changes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_upline  TEXT,
  new_upline  TEXT,
  changed_by  INTEGER REFERENCES users(id),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  note        TEXT
);

CREATE TABLE IF NOT EXISTS batches (
  id             SERIAL PRIMARY KEY,
  number         INTEGER NOT NULL UNIQUE,
  workshop_start TIMESTAMPTZ NOT NULL,
  workshop_end   TIMESTAMPTZ NOT NULL,
  venue          TEXT NOT NULL,
  checkin_token  TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zoom_sessions (
  id           SERIAL PRIMARY KEY,
  batch_id     INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  seq          INTEGER NOT NULL,
  starts_at    TIMESTAMPTZ,
  duration_min INTEGER NOT NULL DEFAULT 90,
  link         TEXT,
  code         TEXT NOT NULL,
  UNIQUE (batch_id, seq)
);

CREATE TABLE IF NOT EXISTS workshop_registrations (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id      INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, batch_id)
);

CREATE TABLE IF NOT EXISTS workshop_attendance (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id    INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  method      TEXT NOT NULL,      -- qr | manual
  recorded_by INTEGER REFERENCES users(id),
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, batch_id)
);

CREATE TABLE IF NOT EXISTS zoom_attendance (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zoom_session_id INTEGER NOT NULL REFERENCES zoom_sessions(id) ON DELETE CASCADE,
  method          TEXT NOT NULL,  -- code | manual
  recorded_by     INTEGER REFERENCES users(id),
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, zoom_session_id)
);

CREATE TABLE IF NOT EXISTS reminders_sent (
  kind     TEXT NOT NULL,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ref_id   INTEGER NOT NULL DEFAULT 0,
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, user_id, ref_id)
);
