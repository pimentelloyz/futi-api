-- Add index on PlayersOnTeams.teamId to optimize team player listings
-- This migration runs after the table is created (see 20251113212035_explicit_m2m_players_teams)

CREATE INDEX IF NOT EXISTS "PlayersOnTeams_teamId_idx"
  ON "PlayersOnTeams" ("teamId");
