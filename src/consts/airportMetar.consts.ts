/** Max ICAO stations on the Airport METAR screen (layout + AWC batch size). */
export const MAX_AIRPORT_METAR_STATIONS = 8;

/** Used when `rwc-config.json` omits `airportMetarStations` (empty array = none). */
export const DEFAULT_AIRPORT_METAR_STATIONS: ReadonlyArray<{ name: string; code: string }> = [
  { name: "Winnipeg", code: "CYWG" },
  { name: "St. John's", code: "CYYT" },
  { name: "Vancouver", code: "CYVR" },
  { name: "Toronto", code: "CYYZ" },
  { name: "Montreal", code: "CYUL" },
  { name: "Calgary", code: "CYYC" },
  { name: "Chicago", code: "KORD" },
  { name: "New York", code: "KJFK" },
];

/** Minimum reporting rows to show the screen (hide if empty / loading). */
export const MIN_AIRPORT_METAR_STATIONS_TO_DISPLAY = 1;

export const AIRPORT_METAR_FETCH_INTERVAL_MS = 5 * 60 * 1000;

export const AIRPORT_METAR_HTTP_TIMEOUT_MS = 45_000;
