import type { NationalStationObservations } from "types";
import type { WeatherStationTimeData } from "types";

/** Playwright / visual check: `?e2eAirportMetar=1` renders only the METAR plate with deterministic rows (no SSE). */
export function isE2eAirportMetarFixture(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("e2eAirportMetar") === "1";
  } catch {
    return false;
  }
}

/** Fixed clock so the title line matches screenshot baselines. */
export const E2E_AIRPORT_METAR_WEATHER_TIME: WeatherStationTimeData = {
  observedDateTime: "2026-04-10T10:00:00.000Z",
  stationOffsetMinutesFromLocal: -300,
  timezone: "CDT",
};

/** Rows shaped like live AWC-backed payloads (abbreviated tail + padded flt cat). */
export const E2E_AIRPORT_METAR_OBSERVATIONS: NationalStationObservations = [
  {
    name: "Winnipeg",
    code: "CYWG",
    temperature: 0,
    condition: "VFR · OVC · 9 kt",
    abbreviatedCondition: "ovc · 9",
    metarFltCatPadded: "vfr ",
  },
  {
    name: "St. John's",
    code: "CYYT",
    temperature: -2,
    condition: "VFR · FEW · 3 kt",
    abbreviatedCondition: "few · 3",
    metarFltCatPadded: "vfr ",
  },
  {
    name: "Vancouver",
    code: "CYVR",
    temperature: 7,
    condition: "VFR · SKC · 0 kt",
    abbreviatedCondition: "skc · 0",
    metarFltCatPadded: "vfr ",
  },
  {
    name: "Toronto",
    code: "CYYZ",
    temperature: 4,
    condition: "VFR · OVC · 11 kt",
    abbreviatedCondition: "ovc · 11",
    metarFltCatPadded: "vfr ",
  },
  {
    name: "Montreal",
    code: "CYUL",
    temperature: 8,
    condition: "VFR · OVC · 4 kt",
    abbreviatedCondition: "ovc · 4",
    metarFltCatPadded: "vfr ",
  },
  {
    name: "Calgary",
    code: "CYYC",
    temperature: 0,
    condition: "VFR · SKC · 2 kt",
    abbreviatedCondition: "skc · 2",
    metarFltCatPadded: "vfr ",
  },
  {
    name: "New York",
    code: "KJFK",
    temperature: 4,
    condition: "MVFR · BKN · 5 kt",
    abbreviatedCondition: "bkn · 5",
    metarFltCatPadded: "mvfr",
  },
];
