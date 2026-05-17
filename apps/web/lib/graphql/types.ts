// Type for a single Building, matching the GraphQL query
export interface Building {
  uuid: string;
  name: string | null;
  asset_type: string | null;
  asset_status: string | null;
  asset_active: boolean | null;
  asset_latitude: number | null;
  asset_longitude: number | null;
  created_at: string;
  updated_at: string;
  efficiency?: number;
}

// Type for a single WeatherData point
export interface WeatherData {
  id: string;
  asset_name: string | null;
  time_period: string;
  cloudiness: number | null;
  outdoor_temperature: number | null;
}

// The complete shape of the data returned by the GET_OVERVIEW_PAGE_DATA query
export interface OverviewPageData {
  overview: {
    buildings: Building[];
    weather: WeatherData[];
  };
}

// Add this new interface to your types.ts file

export interface RetrospectDataPoint {
    __typename?: 'RetrospectDataPoint';
    id: string;
    uuid: string;
    building_control?: string | null;
    time_period: string;
    most_wanted?: number | null;
    efficiency?: number | null;
    overflow_abs?: number | null;
    fault_prim_loss?: number | null;
    fault_smirch?: number | null;
    fault_heat_sys?: number | null;
    fault_valve?: number | null;
    fault_transfer?: number | null;
    dt_abs?: number | null;
    dt_vw?: number | null;
    dt_ideal?: number | null;
    rt_abs?: number | null;
    rt_vw?: number | null;
    demand_sig?: number | null;
    demand_flex?: number | null;
    volume_abs?: number | null;
    ntu?: number | null;
    lmtd?: number | null;
    supply_abs?: number | null;
    data_quality_missing_odt?: number | null;
    data_quality_outlier_odt?: number | null;
}