// apps/graphql-api/src/graphql/schema.ts

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # =================================================================
  # CORE TYPES - Based on Database Tables
  # =================================================================

  # Maps 1:1 to the 'buildings' table.
  type Building {
    uuid: ID!
    name: String
    asset_type: String
    asset_status: String
    asset_active: Boolean
    asset_latitude: Float
    asset_longitude: Float
    created_at: String!
    updated_at: String!
  }

  # Maps 1:1 to the 'weather_data' table.
  type WeatherData {
    id: ID!
    asset_name: String
    time_period: String!
    cloudiness: Float
    outdoor_temperature: Float
  }

  # COMPLETE: Maps 1:1 to the 'dashboard_data' table for the Retrospect page.
  type RetrospectDataPoint {
    id: ID!
    uuid: String!
    # ... all other RetrospectDataPoint fields remain the same
    building_control: String
    property_meter: String
    customer_group: String
    geo_group: String
    type_group: String
    generic_group: String
    time_period: String!
    most_wanted: Float
    rank_overall: Float
    rank_network: Float
    rank_customer: Float
    overflow_abs: Float
    overflow_rel: Float
    overflow_spec: Float
    energy_abs: Float
    volume_abs: Float
    volume_spec: Float
    volume_trend: Float
    flow_dim: Float
    demand_sig: Float
    demand_flex: Float
    demand_k: Float
    demand_max: Float
    demand_dim: Float
    dt_abs: Float
    dt_vw: Float
    dt_ideal: Float
    dt_trend: Float
    dt_srd: Float
    rt_abs: Float
    rt_vw: Float
    rt_trend: Float
    rt_srd: Float
    rt_flex: Float
    ntu: Float
    ntu_srd: Float
    lmtd: Float
    efficiency: Float
    efficiency_srd: Float
    supply_abs: Float
    supply_flex: Float
    fault_prim_loss: Float
    fault_smirch: Float
    fault_heat_sys: Float
    fault_valve: Float
    fault_transfer: Float
    data_quality_missing_odt: Float
    data_quality_missing_supply: Float
    data_quality_missing_return: Float
    data_quality_missing_flow: Float
    data_quality_missing_energy: Float
    data_quality_missing_volume: Float
    data_quality_missing_demand: Float
    data_quality_missing_return_sec: Float
    data_quality_missing_supply_sec: Float
    data_quality_outlier_odt: Float
    data_quality_outlier_supply: Float
    data_quality_outlier_return: Float
    data_quality_outlier_flow: Float
    data_quality_outlier_energy: Float
    data_quality_outlier_volume: Float
    data_quality_outlier_demand: Float
    data_quality_outlier_return_sec: Float
    data_quality_outlier_supply_sec: Float
    data_quality_frozen_odt: Float
    data_quality_frozen_supply: Float
    data_quality_frozen_return: Float
    data_quality_frozen_flow: Float
    data_quality_frozen_energy: Float
    data_quality_frozen_volume: Float
    data_quality_frozen_demand: Float
    data_quality_frozen_return_sec: Float
    data_quality_frozen_supply_sec: Float
    primloss_rank: Float
    smirch_rank: Float
    heatsys_rank: Float
    valve_rank: Float
    transfer_rank: Float
    x_sum: Float
    y_sum: Float
    vector_len: Float
    supply_pos: Float
    dt_pos: Float
    rt_pos: Float
    ntu_pos: Float
    eff_pos: Float
  }

  # COMPLETE: Maps 1:1 to the 'monthly_metrics' table for the Building page.
  type MonthlyMetric {
    id: ID!
    building_uuid: String!
    time_period: String!
    building_impact: Float
    # ... all other MonthlyMetric fields remain the same
    saving_kwh: Float
    saving_energy_perc: Float
    saving_energy_sek: Float
    saving_demand_sek: Float
    saving_rt_sek: Float
    saving_volume_sek: Float
    saving_total_sek: Float
    idt_avg: Float
    idt_wanted: Float
  }

  # COMPLETE: Maps 1:1 to the 'daily_metrics' table for the Demand page.
  type DailyMetric {
    id: ID!
    building_uuid: String!
    time_period: String!
    demand: Float
    flow: Float
    temperature_supply: Float
    temperature_return: Float
    ctrl_activity: Float
  }

  # Wrapper for the Overview page response.
  type OverviewData {
    buildings: [Building!]!
    weather: [WeatherData!]!
  }

  # =================================================================
  # INPUT TYPES for Filtering
  # =================================================================
  input SystemPropertyFilter {
    uuids: [String!]
    nameContains: String
    assetType: String
    assetStatus: String
    assetActive: Boolean
  }

  input DateRangeFilter {
    startDate: String!
    endDate: String!
  }

  # =================================================================
  # THE FINAL QUERY API
  # =================================================================
  type Query {
    overview: OverviewData

    retrospectData(
      systemFilter: SystemPropertyFilter
      dateFilter: DateRangeFilter
    ): [RetrospectDataPoint!]

    dailyMetrics(
      systemFilter: SystemPropertyFilter
      dateFilter: DateRangeFilter
    ): [DailyMetric!]
    
    monthlyMetrics(
      systemFilter: SystemPropertyFilter
      dateFilter: DateRangeFilter
    ): [MonthlyMetric!]
  }

  # ADDED: This Input type defines the structure for chat history messages.
  input ChatMessageInput {
    role: String!
    content: String!
  }

  # ADDED: This entire Mutation block is new. It allows you to send questions
  # to the AI copilot without affecting your existing data queries.
  type Mutation {
    analyse(question: String!, history: [ChatMessageInput]): String
  }
`;