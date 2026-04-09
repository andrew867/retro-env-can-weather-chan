export type ProvinceStation = {
  name: string;
  code: string;
  /**
   * ECCC `climate_data/bulk_data_e.html` `stationID` for daily precip when the citypage
   * `yesterdayConditions` block is missing (common outside the primary forecast site).
   */
  climateStationId?: number;
};

export type ProvinceStations = ProvinceStation[];

export type ProvinceStationTracking = {
  station: ProvinceStation;
  minTemp: number | null;
  maxTemp: number | null;
  displayTemp: number | string;
  yesterdayPrecip: number | string | null;
  yesterdayPrecipUnit: string;
};

export type ProvinceTracking = {
  tracking: ProvinceStationTracking[];
  isOvernight: boolean;
  yesterdayPrecipDate: string;
};
