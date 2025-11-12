-- Initialize local Postgres for futi-api
-- This script runs inside the default database ($POSTGRES_DB)

-- Create shadow database for Prisma migrate dev
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'futi_shadow'
   ) THEN
      EXECUTE 'CREATE DATABASE futi_shadow';
   END IF;
END
$$;

-- Enable pgcrypto to support gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;
