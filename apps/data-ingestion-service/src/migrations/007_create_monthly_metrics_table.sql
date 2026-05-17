-- FILE: apps/data-ingestion-service/src/migrations/007_create_monthly_metrics_table.sql
-- This table stores all time-series metrics that are recorded on a monthly basis.
-- REFINED: Specific monthly metrics from TEST_building_impact.csv.

CREATE TABLE IF NOT EXISTS monthly_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- This links each metric record back to a specific building in our master table.
    building_uuid TEXT NOT NULL REFERENCES buildings(uuid) ON DELETE CASCADE,
    
    -- The date for this specific data point (e.g., the first of the month).
    time_period DATE NOT NULL,
    
    -- Monthly Metrics from the 'building_impact' file
    building_impact NUMERIC,       -- Primary financial metric, mapped from saving_total_sek
    saving_kwh NUMERIC,
    saving_energy_perc NUMERIC,
    saving_energy_sek NUMERIC,
    saving_demand_sek NUMERIC,
    saving_rt_sek NUMERIC,
    saving_volume_sek NUMERIC,
    saving_total_sek NUMERIC,      -- Explicitly included as the source for building_impact
    idt_avg NUMERIC,
    idt_wanted NUMERIC,

    -- This ensures we only have one record per building per month.
    UNIQUE (building_uuid, time_period)
);

-- Create an index for faster queries when filtering by building and time.
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_building_uuid_time_period ON monthly_metrics (building_uuid, time_period);