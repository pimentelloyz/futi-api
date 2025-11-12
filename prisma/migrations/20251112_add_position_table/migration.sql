-- Create Position table
CREATE TABLE IF NOT EXISTS "Position" (
  "slug" VARCHAR(20) PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trigger updatedAt on update (PostgreSQL)
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_on_position ON "Position";
CREATE TRIGGER set_timestamp_on_position
BEFORE UPDATE ON "Position"
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
