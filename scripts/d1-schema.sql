CREATE TABLE IF NOT EXISTS object_index (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  difficulty REAL,
  numSlots INTEGER,
  craftable INTEGER
);

CREATE TABLE IF NOT EXISTS object_data (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ids TEXT NOT NULL
);
