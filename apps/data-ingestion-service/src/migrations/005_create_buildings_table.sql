-- FILE: apps/data-ingestion-service/src/migrations/005_create_buildings_table.sql
-- This table will store the mapping from a building's name to its UUID.
-- It is our master list of all assets.

CREATE TABLE IF NOT EXISTS buildings (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    asset_type TEXT,
    asset_status TEXT,
    asset_active BOOLEAN,
    asset_latitude NUMERIC,
    asset_longitude NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for faster lookups by name, which we will do frequently.
CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings (name);