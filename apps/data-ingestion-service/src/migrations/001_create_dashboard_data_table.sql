-- FILE: apps/data-ingestion-service/src/migrations/001_create_dashboard_data_table.sql
-- This table is for the comprehensive, granular time-series data, primarily from the 'retrospect' file.
-- All metric/rank columns are NUMERIC for maximum flexibility.
-- Relaxed NOT NULL constraints on non-universal columns.
-- Contains ALL columns from retrospect_1_0_3_example.csv except for primary keys and foreign keys managed elsewhere.
-- This table is designed to be the main data sourse for the overview page, important for performance and flexibility.

CREATE TABLE IF NOT EXISTS dashboard_data (
    -- Surrogate Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Building identification
    uuid TEXT NOT NULL, -- UUID from the retrospect file, linked to buildings.uuid
    building_control TEXT,
    property_meter TEXT,
    customer_group TEXT,
    geo_group TEXT,
    type_group TEXT,
    generic_group TEXT,
    
    -- Time-series Data Point
    time_period TIMESTAMP WITH TIME ZONE NOT NULL,

    -- All metric columns from retrospect_1_0_3_example.csv
    most_wanted NUMERIC,
    rank_overall NUMERIC,
    rank_network NUMERIC,
    rank_customer NUMERIC,
    overflow_abs NUMERIC,
    overflow_rel NUMERIC,
    overflow_spec NUMERIC,
    energy_abs NUMERIC,
    volume_abs NUMERIC,
    volume_spec NUMERIC,
    volume_trend NUMERIC,
    flow_dim NUMERIC,
    demand_sig NUMERIC,
    demand_flex NUMERIC,
    demand_k NUMERIC,
    demand_max NUMERIC,
    demand_dim NUMERIC,
    dt_abs NUMERIC,
    dt_vw NUMERIC,
    dt_ideal NUMERIC,
    dt_trend NUMERIC,
    dt_srd NUMERIC,
    rt_abs NUMERIC,
    rt_vw NUMERIC,
    rt_trend NUMERIC,
    rt_srd NUMERIC,
    rt_flex NUMERIC,
    ntu NUMERIC,
    ntu_srd NUMERIC,
    lmtd NUMERIC,
    efficiency NUMERIC,
    efficiency_srd NUMERIC,
    supply_abs NUMERIC,
    supply_flex NUMERIC,
    fault_prim_loss NUMERIC,
    fault_smirch NUMERIC,
    fault_heat_sys NUMERIC,
    fault_valve NUMERIC,
    fault_transfer NUMERIC,
    data_quality_missing_odt NUMERIC,
    data_quality_missing_supply NUMERIC,
    data_quality_missing_return NUMERIC,
    data_quality_missing_flow NUMERIC,
    data_quality_missing_energy NUMERIC,
    data_quality_missing_volume NUMERIC,
    data_quality_missing_demand NUMERIC,
    data_quality_missing_return_sec NUMERIC,
    data_quality_missing_supply_sec NUMERIC,
    data_quality_outlier_odt NUMERIC,
    data_quality_outlier_supply NUMERIC,
    data_quality_outlier_return NUMERIC,
    data_quality_outlier_flow NUMERIC,
    data_quality_outlier_energy NUMERIC,
    data_quality_outlier_volume NUMERIC,
    data_quality_outlier_demand NUMERIC,
    data_quality_outlier_return_sec NUMERIC,
    data_quality_outlier_supply_sec NUMERIC,
    data_quality_frozen_odt NUMERIC,
    data_quality_frozen_supply NUMERIC,
    data_quality_frozen_return NUMERIC,
    data_quality_frozen_flow NUMERIC,
    data_quality_frozen_energy NUMERIC,
    data_quality_frozen_volume NUMERIC,
    data_quality_frozen_demand NUMERIC,
    data_quality_frozen_return_sec NUMERIC,
    data_quality_frozen_supply_sec NUMERIC,
    primloss_rank NUMERIC,
    smirch_rank NUMERIC,
    heatsys_rank NUMERIC,
    valve_rank NUMERIC,
    transfer_rank NUMERIC,
    x_sum NUMERIC,
    y_sum NUMERIC,
    vector_len NUMERIC,
    supply_pos NUMERIC,
    dt_pos NUMERIC,
    rt_pos NUMERIC,
    ntu_pos NUMERIC,
    eff_pos NUMERIC,

    -- Composite Unique Constraint
    UNIQUE (uuid, time_period)
);

-- Create an index on time_period for faster time-series queries
CREATE INDEX IF NOT EXISTS idx_dashboard_data_time_period ON dashboard_data (time_period);

-- Create a composite index on uuid and time_period for faster filtering and joins
CREATE INDEX IF NOT EXISTS idx_dashboard_data_uuid_time_period ON dashboard_data (uuid, time_period);