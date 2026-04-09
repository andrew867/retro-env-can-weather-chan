import type { InitChannel, WeatherStation } from "../../src/types";
import { Screens } from "../../src/consts/screens.consts";

const isoTime = "2026-04-07T22:00:00.000Z";

function wordBlock(prefix: string, count: number): string {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`).join(" ");
}

function fc(
  period: string,
  abbreviatedTextSummary: string
): WeatherStation["forecast"][number] {
  return {
    period,
    textSummary: abbreviatedTextSummary,
    abbreviatedTextSummary,
    temperature: { value: 0, class: "high" },
    conditions: "Cloudy",
  };
}

/** Minimal observed + almanac so Conditions + forecast mount. */
function baseStation(): WeatherStation {
  return {
    observationID: "pw-forecast-visual-obs",
    city: "Winnipeg",
    stationID: "s0000193",
    fetchedAt: isoTime,
    stationTime: {
      observedDateTime: isoTime,
      stationOffsetMinutesFromLocal: -300,
      timezone: "CDT",
    },
    observed: {
      condition: "Cloudy",
      abbreviatedCondition: "Cloudy",
      temperature: { value: 0, unit: "C" },
      pressure: { value: 101.8, unit: "kPa", change: 0.1, tendency: "falling" },
      humidity: { value: 41, unit: "%" },
      visibility: { value: 24, unit: "km" },
      wind: {
        speed: { value: 38, unit: "km/h" },
        gust: { value: 49, unit: "km/h" },
        direction: "SSE",
      },
      windchill: -5,
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
    forecast: [],
  };
}

/**
 * Enough forecast text (immediate + merged supplementary) to yield multiple playlist pages
 * for alignment regression tests.
 */
export function buildMultiPageForecastStation(): WeatherStation {
  const s = baseStation();
  s.forecast = [
    fc("Today", `${wordBlock("IMM", 48)} TAILIMM. ${wordBlock("IM2", 40)} ENDIMM.`),
    fc("Wednesday", `${wordBlock("WED", 42)} WEDEND.`),
    fc("Thursday night", `${wordBlock("THN", 42)} THNEND.`),
    fc("Friday", `${wordBlock("FRI", 38)} FRIEND.`),
    fc("Saturday", `${wordBlock("SAT", 38)} SATEND.`),
  ];
  return s;
}

/** Init payload: forecast-only flavour, authentic refresh off for stable pixels. */
export function buildForecastOnlyInit(): InitChannel {
  return {
    config: {
      font: "recw",
      provinceHighLowEnabled: false,
      configVersion: "pw-forecast-visual",
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
      name: "pw-forecast-only",
      created: new Date(isoTime),
      modified: new Date(isoTime),
      screens: [{ id: Screens.FORECAST, duration: 3 }],
    },
    music: [],
  };
}
