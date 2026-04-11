import type { InitChannel, WeatherStation } from "../../src/types";
import { Screens } from "../../src/consts/screens.consts";

const isoTime = "2026-04-08T06:00:00.000Z";

function fc(
  period: string,
  abbreviatedTextSummary: string
): WeatherStation["forecast"][number] {
  return {
    period,
    textSummary: abbreviatedTextSummary,
    abbreviatedTextSummary,
    temperature: { value: -11, class: "low" },
    conditions: "Clear",
  };
}

/** Frozen Winnipeg plate for `/` visual regression (matches classic forecast + conditions layout). */
export function buildCanonicalHomeStation(): WeatherStation {
  return {
    observationID: "pw-canonical-home-obs",
    city: "Winnipeg",
    stationID: "s0000193",
    fetchedAt: isoTime,
    stationTime: {
      observedDateTime: isoTime,
      stationOffsetMinutesFromLocal: -300,
      timezone: "CDT",
    },
    observed: {
      condition: "Clear",
      abbreviatedCondition: "CLEAR",
      temperature: { value: -6, units: "C" },
      pressure: { value: 101.2, units: "kPa", change: 0, tendency: "steady" },
      humidity: { value: 69, units: "%" },
      visibility: { value: 24, units: "km" },
      wind: {
        speed: { value: 7, units: "km/h" },
        gust: { value: 0, units: "km/h" },
        direction: "SW",
      },
      windchill: -7,
    },
    almanac: {
      temperatures: {
        extremeMin: { value: -40, unit: "C", year: 1999 },
        extremeMax: { value: 35, unit: "C", year: 1988 },
        normalMin: { value: -4, unit: "C" },
        normalMax: { value: 8, unit: "C" },
        lastYearMin: { value: -9.2, unit: "C" },
        lastYearMax: { value: 0, unit: "C" },
      },
      sunRiseSet: { rise: "06:30", set: "20:15", timezone: "CDT" },
    },
    forecast: [
      fc("Tonight", "LOW -11. FEW CLOUDS. WIND NW 20 BCMG S 20 AFTER 12AM. WIND CHILL -7 THIS EVE & -19 OVRNGT."),
    ],
  };
}

export function buildCanonicalHomeInit(): InitChannel {
  return {
    config: {
      font: "recw",
      provinceHighLowEnabled: false,
      configVersion: "pw-canonical-home",
      showFooterFreshnessHint: false,
      useOfficialFonts: true,
    },
    gfx: {
      displayAspectRatio: "4:3",
      displayResolution: "sd",
      features: {
        authenticRefreshEnabled: false,
        nextGenVisualLayersEnabled: false,
      },
      safeArea: { top: 0.02, bottom: 0.06, left: 0.02, right: 0.02 },
      retro: {
        scanlinesOpacity: 0,
        phosphorTint: "none",
        vignetteStrength: 0,
        vhsAnalogLayerEnabled: false,
        vhsHeadSwitchTearEnabled: false,
        reloadLineMs: 30,
      },
    },
    authenticRefresh: {
      enabled: false,
      respectReducedMotion: true,
    },
    crawler: [],
    flavour: {
      name: "pw-canonical-home",
      created: new Date(isoTime),
      modified: new Date(isoTime),
      screens: [{ id: Screens.FORECAST, duration: 14 }],
    },
    music: [],
  };
}
