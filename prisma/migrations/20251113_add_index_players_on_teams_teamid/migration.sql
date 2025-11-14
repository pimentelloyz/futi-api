-- Add index on PlayersOnTeams.teamId to optimize team player listings
-- If your environment runs migrations in a transaction, this CREATE INDEX will be executed within it.
-- For large tables in production, consider creating the index concurrently outside of a transaction.

CREATE INDEX IF NOT EXISTS "PlayersOnTeams_teamId_idx"
  ON "PlayersOnTeams" ("teamId");
