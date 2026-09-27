-- Run once against the D1 database bound as QUESTIONS_DB.
CREATE TABLE IF NOT EXISTS contributed_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  delete_code_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS contributed_questions_created_at
  ON contributed_questions(created_at);
