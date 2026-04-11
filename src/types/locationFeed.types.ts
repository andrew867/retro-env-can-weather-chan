import type { AirportMetarStation } from "./config.types";

/** METAR list heuristic for SWOB-derived ICAO picks near the primary citypage point. */
export type MetarHeuristic = "nearest" | "interesting";

export type LocationFeedClimateSuggestion = {
  historicalDataStationID: number;
  climateNormalsClimateID: number;
  climateNormalsStationID: number;
  stationName: string;
  normalCode: string;
  distanceKm: number;
};

export type LocationFeedLtceSuggestion = {
  virtualClimateId: string;
  virtualStationNameEn: string;
  distanceKm: number;
};

export type LocationFeedAqhiSuggestion = {
  /** Stored as `airQualityStation` (`{zone}/{location_id}`). */
  stationKey: string;
  locationNameEn: string;
  distanceKm: number;
};

/** Read-only MSC resolution for a citypage site (used by preview + quick setup). */
export type LocationFeedSuggestions = {
  citypageLatLon: { lat: number; long: number } | null;
  climate: LocationFeedClimateSuggestion | null;
  ltce: LocationFeedLtceSuggestion | null;
  aqhi: LocationFeedAqhiSuggestion | null;
  airportMetar: AirportMetarStation[];
};

export type LocationFeedResolveFlags = {
  /**
   * When true and `hasCuratedAnchor` is false, resolve nearest MSC `climate-stations` feature
   * (hourly + normals) and nearest LTCE virtual station from OGC geometry.
   */
  dynamicClimateAndLtce: boolean;
  aqhi: boolean;
  metar: boolean;
  metarHeuristic: MetarHeuristic;
  /** When true, `dynamicClimateAndLtce` does not run (curated anchor already covers bundle). */
  hasCuratedAnchor: boolean;
};
