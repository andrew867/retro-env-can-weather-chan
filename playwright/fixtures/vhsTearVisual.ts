import type { InitChannel, WeatherStation } from "../../src/types";
import { Screens } from "../../src/consts/screens.consts";

const isoTime = "2026-04-09T18:00:00.000Z";

/** Minimal station so SSE mock can emit conditions + almanac (static screen, no forecast reload line). */
export function buildVhsTearStation(): WeatherStation {
  return {
    observationID: "pw-vhs-tear-obs",
    city: "Winnipeg",
    stationID: "s0000193",
    fetchedAt: isoTime,
    stationTime: {
      observedDateTime: isoTime,
      stationOffsetMinutesFromLocal: -300,
      timezone: "CDT",
    },
    observed: {
      condition: "Light Snow",
      abbreviatedCondition: "Light snow",
      temperature: { value: -11, units: "C" },
      pressure: { value: 101.2, units: "kPa", change: 0, tendency: "steady" },
      humidity: { value: 78, units: "%" },
      visibility: { value: 8, units: "km" },
      wind: { speed: { value: 22, units: "km/h" }, gust: { value: 32, units: "km/h" }, direction: "NNW" },
      windchill: -19,
    },
    almanac: {
      temperatures: {
        extremeMin: { value: -38, unit: "C", year: 1996 },
        extremeMax: { value: 8.3, unit: "C", year: 1992 },
        normalMin: { value: -13, unit: "C" },
        normalMax: { value: -6, unit: "C" },
        lastYearMin: { value: -9, unit: "C" },
        lastYearMax: { value: -4, unit: "C" },
      },
      sunRiseSet: { rise: "07:35", set: "18:10", timezone: "CST" },
    },
    forecast: [
      {
        period: "Tonight",
        textSummary: "Cold.",
        abbreviatedTextSummary: "Cold.",
        temperature: { value: -18, class: "low" },
        conditions: "Clear",
      },
    ],
  };
}

/** 4:3 SD, analog + scanlines + head-switch tear on (matches typical “everything on” operator setup). */
export function buildVhsTearInit(): InitChannel {
  return {
    config: {
      font: "recw",
      provinceHighLowEnabled: false,
      configVersion: "pw-vhs-tear",
      showFooterFreshnessHint: false,
      useOfficialFonts: true,
    },
    gfx: {
      displayAspectRatio: "4:3",
      displayResolution: "sd",
      features: {
        authenticRefreshEnabled: false,
        nextGenVisualLayersEnabled: true,
      },
      safeArea: { top: 0.02, bottom: 0.06, left: 0.02, right: 0.02 },
      retro: {
        scanlinesOpacity: 0.08,
        phosphorTint: "none",
        vignetteStrength: 0.12,
        vhsAnalogLayerEnabled: true,
        vhsHeadSwitchTearEnabled: true,
        reloadLineMs: 100,
      },
    },
    authenticRefresh: {
      enabled: false,
      respectReducedMotion: true,
    },
    crawler: [],
    flavour: {
      name: "pw-vhs-tear",
      created: new Date(isoTime),
      modified: new Date(isoTime),
      screens: [{ id: Screens.ALMANAC, duration: 30 }],
    },
    music: [],
  };
}
