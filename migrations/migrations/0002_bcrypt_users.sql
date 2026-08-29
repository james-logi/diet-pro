PRAGMA foreign_keys = OFF;
ALTER TABLE users RENAME TO users_legacy;
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL DEFAULT 'bcrypt',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO users (id, username, name, password_hash, password_salt, created_at)
SELECT id, username, name, password_hash, COALESCE(password_salt, 'bcrypt'), created_at FROM users_legacy;
DROP TABLE users_legacy;
PRAGMA foreign_keys = ON;
