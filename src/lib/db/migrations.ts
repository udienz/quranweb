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
  {
    // Tables of the auth library (Better Auth) for OIDC sign-in, with the column names and types
    // it expects (checked against the library by src/lib/auth/auth.test.ts), plus two columns of
    // our own on `user`. The tables of migration 1 (`users` and the data tables that point to it)
    // are left alone: no code has ever read or written them. Step 5 (account sync) creates the data
    // tables that point to "user"(id), and a later cleanup, two releases on, drops the old ones.
    version: 2,
    name: "oidc-sign-in",
    sql: `
CREATE TABLE "user" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" integer NOT NULL,
  "image" text,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL,
  "disabledAt" integer,
  "lastSeenAt" integer
);

CREATE TABLE "session" (
  "id" text NOT NULL PRIMARY KEY,
  "expiresAt" date NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" date,
  "refreshTokenExpiresAt" date,
  "scope" text,
  "password" text,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL
);

CREATE TABLE "verification" (
  "id" text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" date NOT NULL,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL
);

CREATE INDEX "session_userId_idx" ON "session" ("userId");
CREATE INDEX "account_userId_idx" ON "account" ("userId");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
CREATE UNIQUE INDEX "account_provider_subject_idx" ON "account" ("providerId", "accountId");
`,
  },
  {
    // The reading data of a signed-in reader (step 5): one JSON document per account, in the same
    // version-2 format the browser keeps, validated and merged by the same code (userdata/schema.ts).
    // The whole state is small (limits in the schema) and exchanged in one request, so one document
    // is simpler than four tables and cannot drift from the browser format. Replaces the plan in
    // PHASE3.md of separate reading_state/progress/bookmarks/preferences tables.
    version: 3,
    name: "account-data",
    sql: `
CREATE TABLE account_data (
  user_id    TEXT NOT NULL PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`,
  },
  {
    // What the admin did, kept after the account it was done to is gone (so no foreign key).
    // The unused audit_log table of migration 1 stays until the later cleanup.
    version: 4,
    name: "admin-audit",
    sql: `
CREATE TABLE admin_audit (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  at             INTEGER NOT NULL,
  actor_email    TEXT NOT NULL,
  action         TEXT NOT NULL,
  target_user_id TEXT NOT NULL
);
`,
  },
  {
    // The destructive half of the two-release rule: drop the tables of migration 1. No released code has ever read or
    // written them (checked for v2.2.0, where migrations 1 to 4 first shipped, through v2.5.0), and three releases have
    // passed, so every image a rollback can reach works without them. As a safeguard the drop only happens when all six are
    // empty: the INSERT below breaks the named CHECK if any holds a row, the whole migration is rolled back, the app does
    // not start and the deploy restores the previous image. Nothing is lost; look at the rows, then decide.
    version: 5,
    name: "drop-unused-v1-tables",
    sql: `
CREATE TEMP TABLE v1_tables_guard (rows INTEGER CONSTRAINT v1_tables_must_be_empty CHECK (rows = 0));
INSERT INTO v1_tables_guard SELECT
  (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM reading_state) + (SELECT COUNT(*) FROM progress) +
  (SELECT COUNT(*) FROM bookmarks) + (SELECT COUNT(*) FROM preferences) + (SELECT COUNT(*) FROM audit_log);
DROP TABLE v1_tables_guard;
DROP TABLE reading_state;
DROP TABLE progress;
DROP TABLE bookmarks;
DROP TABLE preferences;
DROP TABLE audit_log;
DROP TABLE users;
`,
  },
];
