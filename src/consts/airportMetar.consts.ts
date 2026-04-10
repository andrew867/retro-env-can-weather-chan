/** Max ICAO stations on the Airport METAR screen (layout + AWC batch size). */
export const MAX_AIRPORT_METAR_STATIONS = 7;

/** Monospace name column on the METAR screen (tighter than {@link MAX_NATIONAL_STATION_NAME_LENGTH} to fit flt cat + wind). */
export const AIRPORT_METAR_NAME_FIELD_WIDTH = 11;

/** Padded flight category column (VFR/MVFR/IFR/LIFR). */
export const AIRPORT_METAR_FLT_CAT_FIELD_WIDTH = 4;

/** Max length for `harshTruncateConditions` on the cover · wind tail only. */
export const AIRPORT_METAR_REST_CONDITION_MAX = 11;

/** Used when `rwc-config.json` omits `airportMetarStations`, it is `[]`, or every entry is invalid. */
export const DEFAULT_AIRPORT_METAR_STATIONS: ReadonlyArray<{ name: string; code: string }> = [
  { name: "Winnipeg", code: "CYWG" },
  { name: "St. John's", code: "CYYT" },
  { name: "Vancouver", code: "CYVR" },
  { name: "Toronto", code: "CYYZ" },
  { name: "Montreal", code: "CYUL" },
  { name: "Calgary", code: "CYYC" },
  { name: "New York", code: "KJFK" },
];

/** Minimum reporting rows to show the screen (hide if empty / loading). */
export const MIN_AIRPORT_METAR_STATIONS_TO_DISPLAY = 1;

export const AIRPORT_METAR_FETCH_INTERVAL_MS = 5 * 60 * 1000;

export const AIRPORT_METAR_HTTP_TIMEOUT_MS = 45_000;
