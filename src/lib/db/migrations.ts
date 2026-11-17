// Numbered, additive migrations. A migration is never edited after it has shipped: add a
// new one. Additive only (new tables, new nullable columns), so the previous image can
// still read a database that a newer image has migrated (rollback in scripts/deploy.sh).
// A destructive change takes two releases: stop using the thing, then drop it.

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: "accounts-and-reading-data",
    sql: `
CREATE TABLE users (
  id           INTEGER PRIMARY KEY,
  google_sub   TEXT NOT NULL UNIQUE,
  email        TEXT NOT NULL,
  name         TEXT,
  created_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  disabled_at  INTEGER
);

CREATE TABLE reading_state (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_read_surah   INTEGER,
  last_read_verse   INTEGER,
  last_read_at      INTEGER,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah       INTEGER NOT NULL,
  read_up_to  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER,
  PRIMARY KEY (user_id, surah)
);

CREATE TABLE bookmarks (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah       INTEGER NOT NULL,
  verse       INTEGER NOT NULL,
  note        TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER,
  PRIMARY KEY (user_id, surah, verse)
);

CREATE TABLE preferences (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selection_json TEXT,
  locale         TEXT,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE audit_log (
  id             INTEGER PRIMARY KEY,
  at             INTEGER NOT NULL,
  actor_email    TEXT NOT NULL,
  action         TEXT NOT NULL,
  target_user_id INTEGER
);
`,
  },
];
