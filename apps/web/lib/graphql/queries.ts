import { gql } from '@apollo/client';

export const GET_OVERVIEW_PAGE_DATA = gql`
  query GetOverviewPage {
    overview {
      buildings {
        uuid
        name
        asset_type
        asset_status
        asset_active
        asset_latitude
        asset_longitude

      }
      weather {
        time_period
        outdoor_temperature
      }
    }
  }
`;

export const GET_RETROSPECT_DATA = gql`
  query GetRetrospectData(
    $dateFilter: DateRangeFilter!
    $systemFilter: SystemPropertyFilter
  ) {
    retrospectData(dateFilter: $dateFilter, systemFilter: $systemFilter) {
      id
      uuid
      building_control
      property_meter
      customer_group
      geo_group
      type_group
      generic_group
      time_period
      most_wanted
      rank_overall
      rank_network
      rank_customer
      overflow_abs
      overflow_rel
      overflow_spec
      energy_abs
      volume_abs
      volume_spec
      volume_trend
      flow_dim
      demand_sig
      demand_flex
      demand_k
      demand_max
      demand_dim
      dt_abs
      dt_vw
      dt_ideal
      dt_trend
      dt_srd
      rt_abs
      rt_vw
      rt_trend
      rt_srd
      rt_flex
      ntu
      ntu_srd
      lmtd
      efficiency
      efficiency_srd
      supply_abs
      supply_flex
      fault_prim_loss
      fault_smirch
      fault_heat_sys
      fault_valve
      fault_transfer
      data_quality_missing_odt
      data_quality_missing_supply
      data_quality_missing_return
      data_quality_missing_flow
      data_quality_missing_energy
      data_quality_missing_volume
      data_quality_missing_demand
      data_quality_missing_return_sec
      data_quality_missing_supply_sec
      data_quality_outlier_odt
      data_quality_outlier_supply
      data_quality_outlier_return
      data_quality_outlier_flow
      data_quality_outlier_energy
      data_quality_outlier_volume
      data_quality_outlier_demand
      data_quality_outlier_return_sec
      data_quality_outlier_supply_sec
      data_quality_frozen_odt
      data_quality_frozen_supply
      data_quality_frozen_return
      data_quality_frozen_flow
      data_quality_frozen_energy
      data_quality_frozen_volume
      data_quality_frozen_demand
      data_quality_frozen_return_sec
      data_quality_frozen_supply_sec
      primloss_rank
      smirch_rank
      heatsys_rank
      valve_rank
      transfer_rank
      x_sum
      y_sum
      vector_len
      supply_pos
      dt_pos
      rt_pos
      ntu_pos
      eff_pos 
    }
  }
`;