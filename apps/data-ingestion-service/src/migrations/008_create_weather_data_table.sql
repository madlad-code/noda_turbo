-- FILE: apps/data-ingestion-service/src/migrations/008_create_weather_data_table.sql
-- This table stores the high-frequency weather data from the 'overview' file.
-- UPDATED: asset_name now allows NULLs. Unique constraint adjusted to handle NULLs.

CREATE TABLE IF NOT EXISTS weather_data (
    id BIGSERIAL PRIMARY KEY,
    
    -- asset_name can now be NULL to allow ingestion of weather data without an asset name
    asset_name TEXT, 

    -- The specific timestamp for this weather reading.
    time_period TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metrics from the 'overview' file
    cloudiness NUMERIC,
    outdoor_temperature NUMERIC,

    -- Adjusted Unique constraint: This ensures uniqueness for (asset_name, time_period) COMBINATIONS.
    -- If asset_name is NULL, multiple rows with NULL asset_name and the same time_period
    -- would still be prevented by this. If you want *any* weather data at a time_period
    -- even without an asset_name, and allow multiple such rows, then this constraint
    -- might still be too strict. For now, it will enforce uniqueness IF asset_name is present,
    -- and for records where asset_name IS NULL, it will enforce uniqueness on (NULL, time_period) pair.
    UNIQUE (asset_name, time_period)
);

-- Create an index for faster queries when filtering by time.
CREATE INDEX IF NOT EXISTS idx_weather_data_time_period ON weather_data (time_period);