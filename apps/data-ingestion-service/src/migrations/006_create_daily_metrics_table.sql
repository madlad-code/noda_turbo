-- FILE: apps/data-ingestion-service/src/migrations/006_create_daily_metrics_table.sql
-- This table stores all time-series metrics that are recorded on a daily basis.
-- REFINED: Specific daily metrics from retrospect and demand/building_ctrl files.

CREATE TABLE IF NOT EXISTS daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- This links each metric record back to a specific building in our master table.
    building_uuid TEXT NOT NULL REFERENCES buildings(uuid) ON DELETE CASCADE,
    
    -- The date for this specific data point.
    time_period DATE NOT NULL,
    
    -- Daily Metrics from 'retrospect' file
    efficiency NUMERIC,
    rank_overall NUMERIC,

    -- Daily Metrics from 'demand' ('building_ctrl') file
    demand NUMERIC,
    flow NUMERIC,
    temperature_supply NUMERIC,
    temperature_return NUMERIC,
    ctrl_activity NUMERIC, -- From TEST_building_ctrl.csv

    -- This ensures we only have one record per building per day.
    UNIQUE (building_uuid, time_period)
);

-- Create an index for faster queries when filtering by building and time.
CREATE INDEX IF NOT EXISTS idx_daily_metrics_building_uuid_time_period ON daily_metrics (building_uuid, time_period);